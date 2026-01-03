// backend/src/modules/documents/document.service.ts
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "../../config/supabase.js";
import { DocumentModel } from "../../models/Document.js";
import { AppError } from "../../utils/AppError.js";
import { Chat } from "../../models/Chat.js";
import { SubjectFolder } from "../../models/Folder.js";
import { getRagQueue } from "../../queues/rag.queue.js"; // ← CHANGE

const MAX_DOCUMENTS_PER_USER = 15;

interface UploadResult {
  id: string;
  fileName: string;
  size: number;
  status: string;
  createdAt: Date;
  jobId?: string; // ← ADD jobId
}

interface EnrichedDocument {
  id: string;
  fileName: string;
  size: number;
  status: string;
  createdAt: Date;
  chatId: string;
  chatTitle: string;
  folderName: string;
  pageCount?: number;
}

export class DocumentService {
  static async checkDocumentLimit(userId: string): Promise<void> {
    const count = await DocumentModel.countDocuments({ ownerId: userId });
    
    if (count >= MAX_DOCUMENTS_PER_USER) {
      throw new AppError(
        `Document limit reached. Maximum ${MAX_DOCUMENTS_PER_USER} documents allowed.`,
        400
      );
    }
  }

  /**
   * Upload PDF - Store and enqueue (NO processing here)
   */
  static async uploadPdf(
    userId: string,
    chatId: string,
    file: Express.Multer.File
  ): Promise<UploadResult> {
    console.log("📤 [DocumentService] Upload started:", { 
      userId, 
      chatId, 
      fileName: file.originalname,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    // Check document limit
    await this.checkDocumentLimit(userId);

    const fileId = uuidv4();
    const storagePath = `${userId}/${chatId}/${fileId}.pdf`;

    // 1️⃣ Upload to Supabase Storage
    console.log("☁️ [DocumentService] Uploading to Supabase...");
    const { error } = await supabaseAdmin.storage
      .from("pdf-uploads")
      .upload(storagePath, file.buffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ [DocumentService] Supabase upload error:", error);
      throw new AppError(`Failed to upload PDF: ${error.message}`, 500);
    }

    console.log("✅ [DocumentService] Supabase upload successful");

    // 2️⃣ Create document metadata (status: processing)
    const doc = await DocumentModel.create({
      ownerId: userId,
      chatId,
      fileName: file.originalname,
      storagePath,
      size: file.size,
      mimeType: file.mimetype,
      status: "processing", // Will be updated by worker
      pageCount: 0,
    });

    console.log("💾 [DocumentService] Document metadata created:", doc._id);

    // 3️⃣ Enqueue RAG job (background processing)
    const job = await getRagQueue().add("process-document", {
      documentId: doc._id.toString(),
      userId,
      chatId,
      storagePath,
      fileName: file.originalname,
    });

    console.log("📮 [DocumentService] Job queued:", job.id);

    // 4️⃣ Return immediately (don't wait for processing)
    return {
      id: doc._id.toString(),
      fileName: doc.fileName,
      size: doc.size,
      status: "processing",
      createdAt: doc.createdAt,
      jobId: job.id,
    };
  }

  /**
   * Get all documents for a user with chat and folder details
   */
  static async getAllUserDocuments(userId: string): Promise<{
    documents: EnrichedDocument[];
    total: number;
    limit: number;
    remaining: number;
  }> {
    console.log("📋 [DocumentService] Fetching all documents for user:", userId);

    const documents = await DocumentModel.find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Get unique chat IDs
    const chatIds = [...new Set(documents.map(doc => doc.chatId))];

    // Fetch all chats with their folder info
    const chats = await Chat.find({ _id: { $in: chatIds } })
      .select("_id title folderId")
      .lean();

    // Get unique folder IDs
    const folderIds = [...new Set(chats.map(chat => chat.folderId).filter(Boolean))];

    // Fetch all folders
    const folders = await SubjectFolder.find({ _id: { $in: folderIds } })
      .select("_id name")
      .lean();

    // Create lookup maps
    const chatMap = new Map(chats.map(chat => [chat._id.toString(), chat]));
    const folderMap = new Map(folders.map(folder => [folder._id.toString(), folder]));

    // Enrich documents
    const enrichedDocuments: EnrichedDocument[] = documents.map(doc => {
      const chat = chatMap.get(doc.chatId.toString());
      const folder = chat?.folderId ? folderMap.get(chat.folderId.toString()) : null;

      return {
        id: doc._id.toString(),
        fileName: doc.fileName,
        size: doc.size,
        status: doc.status,
        createdAt: doc.createdAt,
        chatId: doc.chatId.toString(),
        chatTitle: chat?.title || "Unknown Chat",
        folderName: folder?.name || "No Folder",
        pageCount: doc.pageCount,
      };
    });

    console.log(`✅ [DocumentService] Found ${enrichedDocuments.length} documents`);

    return {
      documents: enrichedDocuments,
      total: enrichedDocuments.length,
      limit: MAX_DOCUMENTS_PER_USER,
      remaining: MAX_DOCUMENTS_PER_USER - enrichedDocuments.length,
    };
  }

  /**
   * Download PDF from Supabase Storage
   */
  static async downloadPdf(userId: string, documentId: string): Promise<{
    buffer: Buffer;
    fileName: string;
  }> {
    console.log("📥 [DocumentService] Download request:", { userId, documentId });

    const doc = await DocumentModel.findOne({
      _id: documentId,
      ownerId: userId,
    });

    if (!doc) {
      throw new AppError("Document not found or access denied", 404);
    }

    console.log("☁️ [DocumentService] Downloading from Supabase:", doc.storagePath);

    const { data, error } = await supabaseAdmin.storage
      .from("pdf-uploads")
      .download(doc.storagePath);

    if (error) {
      console.error("❌ [DocumentService] Supabase download error:", error);
      throw new AppError(`Failed to download PDF: ${error.message}`, 500);
    }

    console.log("✅ [DocumentService] Download successful");

    const buffer = Buffer.from(await data.arrayBuffer());

    return {
      buffer,
      fileName: doc.fileName,
    };
  }

  /**
   * Delete PDF from Supabase Storage and MongoDB
   */
  static async deletePdf(userId: string, documentId: string): Promise<void> {
    console.log("🗑️ [DocumentService] Delete request:", { userId, documentId });

    const doc = await DocumentModel.findOne({
      _id: documentId,
      ownerId: userId,
    });

    if (!doc) {
      throw new AppError("Document not found or access denied", 404);
    }

    console.log("☁️ [DocumentService] Deleting from Supabase:", doc.storagePath);

    // Delete from Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from("pdf-uploads")
      .remove([doc.storagePath]);

    if (error && !error.message.includes("not found")) {
      console.error("❌ [DocumentService] Supabase delete error:", error);
      throw new AppError(`Failed to delete PDF: ${error.message}`, 500);
    }

    // Delete metadata from MongoDB
    await DocumentModel.findByIdAndDelete(documentId);

    console.log("✅ [DocumentService] Document deleted successfully");
  }

  /**
   * List all documents for a specific chat
   */
  static async listChatDocuments(userId: string, chatId: string) {
    const documents = await DocumentModel.find({
      ownerId: userId,
      chatId,
    }).sort({ createdAt: -1 });

    return documents.map(doc => ({
      id: doc._id.toString(),
      fileName: doc.fileName,
      size: doc.size,
      status: doc.status,
      createdAt: doc.createdAt,
      pageCount: doc.pageCount,
    }));
  }
}