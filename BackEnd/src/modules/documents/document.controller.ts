// src/modules/documents/document.controller.ts
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { supabaseAdmin } from "../../config/supabase.js";
import { DocumentModel } from "../../models/Document.js";
import { AppError } from "../../utils/AppError.js";
import { Chat } from "../../models/Chat.js";
import { SubjectFolder } from "../../models/Folder.js";

const MAX_DOCUMENTS_PER_USER = 15;

/**
 * Check if user has reached document limit
 */
async function checkDocumentLimit(userId: string): Promise<void> {
  const count = await DocumentModel.countDocuments({ ownerId: userId });
  
  if (count >= MAX_DOCUMENTS_PER_USER) {
    throw new AppError(
      `Document limit reached. You can upload maximum ${MAX_DOCUMENTS_PER_USER} documents. Please delete some documents to upload new ones.`,
      400
    );
  }
}

/**
 * Upload PDF to Supabase Storage
 */
export async function uploadPdfHandler(req: Request, res: Response) {
  try {
    const userId = req.userContext!.userId;
    const { chatId } = req.body;

    console.log("📤 Upload request:", { userId, chatId, hasFile: !!req.file });

    // Check document limit BEFORE upload
    await checkDocumentLimit(userId);

    // Validations
    if (!req.file) {
      throw new AppError("PDF file is required", 400);
    }

    if (!chatId) {
      throw new AppError("chatId is required", 400);
    }

    const file = req.file;
    const fileId = uuidv4();
    
    // File path structure: userId/chatId/fileId.pdf
    const storagePath = `${userId}/${chatId}/${fileId}.pdf`;

    console.log("☁️ Uploading to Supabase:", {
      bucket: "pdf-uploads",
      path: storagePath,
      size: file.size,
      mimetype: file.mimetype,
    });

    // Upload to Supabase using ADMIN client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from("pdf-uploads")
      .upload(storagePath, file.buffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error);
      throw new AppError(`Failed to upload PDF: ${error.message}`, 500);
    }

    console.log("✅ Supabase upload successful:", data.path);

    // Save metadata to MongoDB
    const doc = await DocumentModel.create({
      ownerId: userId,
      chatId,
      fileName: file.originalname,
      storagePath,
      size: file.size,
      mimeType: file.mimetype,
      status: "uploaded",
    });

    console.log("💾 Document metadata saved:", doc._id);

    // Get signed URL for temporary access (optional)
    const { data: urlData } = await supabaseAdmin.storage
      .from("pdf-uploads")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    res.status(201).json({
      success: true,
      document: {
        id: doc._id,
        fileName: doc.fileName,
        size: doc.size,
        status: doc.status,
        downloadUrl: urlData?.signedUrl,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Upload handler error:", error);
    throw error;
  }
}

/**
 * Get all documents for the authenticated user with chat and folder details
 */
export async function getAllUserDocumentsHandler(req: Request, res: Response) {
  try {
    const userId = req.userContext!.userId;

    console.log("📋 Fetching all documents for user:", userId);

    // Get all documents for this user
    const documents = await DocumentModel.find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Get unique chat IDs
    const chatIds = [...new Set(documents.map(doc => doc.chatId))];

    // Fetch all chats with their folder info
    const chats = await Chat.find({ _id: { $in: chatIds } })
      .select('_id title folderId')
      .lean();

    // Get unique folder IDs
    const folderIds = [...new Set(chats.map(chat => chat.folderId).filter(Boolean))];

    // Fetch all folders
    const folders = await SubjectFolder.find({ _id: { $in: folderIds } })
      .select('_id name')
      .lean();

    // Create lookup maps
    const chatMap = new Map(chats.map(chat => [chat._id.toString(), chat]));
    const folderMap = new Map(folders.map(folder => [folder._id.toString(), folder]));

    // Enrich documents with chat and folder info
    const enrichedDocuments = documents.map(doc => {
      const chat = chatMap.get(doc.chatId.toString());
      const folder = chat?.folderId ? folderMap.get(chat.folderId.toString()) : null;

      return {
        id: doc._id,
        fileName: doc.fileName,
        size: doc.size,
        status: doc.status,
        createdAt: doc.createdAt,
        chatId: doc.chatId,
        chatTitle: chat?.title || 'Unknown Chat',
        folderName: folder?.name || 'No Folder',
      };
    });

    console.log(`✅ Found ${enrichedDocuments.length} documents`);

    res.status(200).json({
      success: true,
      documents: enrichedDocuments,
      total: enrichedDocuments.length,
      limit: MAX_DOCUMENTS_PER_USER,
      remaining: MAX_DOCUMENTS_PER_USER - enrichedDocuments.length,
    });
  } catch (error) {
    console.error("❌ Get all documents error:", error);
    throw error;
  }
}

/**
 * Download/Retrieve PDF from Supabase Storage
 */
export async function downloadPdfHandler(req: Request, res: Response) {
  try {
    const userId = req.userContext!.userId;
    const { documentId } = req.params;

    console.log("📥 Download request:", { userId, documentId });

    // Get document metadata from MongoDB
    const doc = await DocumentModel.findOne({
      _id: documentId,
      ownerId: userId,
    });

    if (!doc) {
      throw new AppError("Document not found or access denied", 404);
    }

    console.log("☁️ Downloading from Supabase:", doc.storagePath);

    // Download from Supabase
    const { data, error } = await supabaseAdmin.storage
      .from("pdf-uploads")
      .download(doc.storagePath);

    if (error) {
      console.error("❌ Supabase download error:", error);
      throw new AppError(`Failed to download PDF: ${error.message}`, 500);
    }

    console.log("✅ Download successful");

    // Send file to client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${doc.fileName}"`
    );
    
    const buffer = Buffer.from(await data.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error("❌ Download handler error:", error);
    throw error;
  }
}

/**
 * Get PDF buffer for RAG processing (internal use)
 */
export async function getPdfBufferForRAG(documentId: string): Promise<Buffer> {
  try {
    const doc = await DocumentModel.findById(documentId);

    if (!doc) {
      throw new Error("Document not found");
    }

    console.log("🤖 Fetching PDF for RAG:", doc.storagePath);

    const { data, error } = await supabaseAdmin.storage
      .from("pdf-uploads")
      .download(doc.storagePath);

    if (error) {
      throw new Error(`Failed to download PDF: ${error.message}`);
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    console.log("✅ PDF buffer ready for RAG processing");
    
    return buffer;
  } catch (error) {
    console.error("❌ Error fetching PDF for RAG:", error);
    throw error;
  }
}

/**
 * Delete PDF from Supabase Storage and MongoDB
 */
export async function deletePdfHandler(req: Request, res: Response) {
  try {
    const userId = req.userContext!.userId;
    const { documentId } = req.params;

    console.log("🗑️ Delete request:", { userId, documentId });

    // Get document metadata
    const doc = await DocumentModel.findOne({
      _id: documentId,
      ownerId: userId,
    });

    if (!doc) {
      throw new AppError("Document not found or access denied", 404);
    }

    console.log("☁️ Deleting from Supabase:", doc.storagePath);

    // Delete from Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from("pdf-uploads")
      .remove([doc.storagePath]);

    if (error) {
      console.error("❌ Supabase delete error:", error);
      // Don't throw error if file doesn't exist in storage
      if (!error.message.includes("not found")) {
        throw new AppError(`Failed to delete PDF: ${error.message}`, 500);
      }
    }

    // Delete metadata from MongoDB
    await DocumentModel.findByIdAndDelete(documentId);

    console.log("✅ Document deleted successfully from both Supabase and MongoDB");

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete handler error:", error);
    throw error;
  }
}

/**
 * List all documents for a specific chat
 */
export async function listChatDocumentsHandler(req: Request, res: Response) {
  try {
    const userId = req.userContext!.userId;
    const { chatId } = req.params;

    const documents = await DocumentModel.find({
      ownerId: userId,
      chatId: chatId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id,
        fileName: doc.fileName,
        size: doc.size,
        status: doc.status,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ List documents error:", error);
    throw error;
  }
}