// backend/src/modules/documents/document.controller.ts
import { Request, Response } from "express";
import { DocumentService } from "./document.service.js";
import { AppError } from "../../utils/AppError.js";
import { DocumentModel } from "../../models/Document.js";

/**
 * Upload PDF to Supabase Storage
 */
export async function uploadPdfHandler(req: Request, res: Response) {
  try {
    const userId = req.userContext!.userId;
    const { chatId } = req.body;

    console.log("📤 [Controller] Upload request:", { userId, chatId, hasFile: !!req.file });

    // Validations
    if (!req.file) {
      throw new AppError("PDF file is required", 400);
    }

    if (!chatId) {
      throw new AppError("chatId is required", 400);
    }

    // Delegate to service
    const result = await DocumentService.uploadPdf(userId, chatId, req.file);

    res.status(201).json({
      success: true,
      document: result,
    });
  } catch (error) {
    console.error("❌ [Controller] Upload handler error:", error);
    throw error;
  }
}

/**
 * Get all documents for the authenticated user with chat and folder details
 */
export async function getAllUserDocumentsHandler(req: Request, res: Response) {
  try {
    const userId = req.userContext!.userId;

    const result = await DocumentService.getAllUserDocuments(userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ [Controller] Get all documents error:", error);
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

    const { buffer, fileName } = await DocumentService.downloadPdf(userId, documentId);

    // Send file to client
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );
    
    res.send(buffer);
  } catch (error) {
    console.error("❌ [Controller] Download handler error:", error);
    throw error;
  }
}

/**
 * Get document processing status
 */
export async function getDocumentStatusHandler(req: Request, res: Response) {
  try {
    const userId = req.userContext!.userId;
    const { documentId } = req.params;

    const doc = await DocumentModel.findOne({
      _id: documentId,
      ownerId: userId,
    });

    if (!doc) {
      throw new AppError("Document not found or access denied", 404);
    }

    res.status(200).json({
      success: true,
      status: doc.status,
      pageCount: doc.pageCount,
      fileName: doc.fileName,
    });
  } catch (error) {
    console.error("❌ [Controller] Get status error:", error);
    throw error;
  }
}

/**
 * Get all documents status for a chat (for batch check)
 */
export async function getChatDocumentsStatusHandler(req: Request, res: Response) {
  try {
    const userId = req.userContext!.userId;
    const { chatId } = req.params;

    const documents = await DocumentModel.find({
      chatId,
      ownerId: userId,
    }).select("_id fileName status pageCount createdAt");

    res.status(200).json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id.toString(),
        fileName: doc.fileName,
        status: doc.status,
        pageCount: doc.pageCount,
        createdAt: doc.createdAt,
      })),
    });
  } catch (error) {
    console.error("❌ [Controller] Get chat documents status error:", error);
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

    await DocumentService.deletePdf(userId, documentId);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("❌ [Controller] Delete handler error:", error);
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

    const documents = await DocumentService.listChatDocuments(userId, chatId);

    res.status(200).json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error("❌ [Controller] List documents error:", error);
    throw error;
  }
}