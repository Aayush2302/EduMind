// src/routes/document.routes.ts
import { Router } from "express";
import {
  uploadPdfHandler,
  downloadPdfHandler,
  deletePdfHandler,
  listChatDocumentsHandler,
  getAllUserDocumentsHandler,
} from "../modules/documents/document.controller.js";
import { pdfUpload } from "../middleware/uploadPdf.js";
import { validateUserContext } from "../middleware/validateUserContext.js";

const router = Router();

// Upload PDF (with 15 document limit check)
router.post(
  "/documents/upload",
  validateUserContext,
  pdfUpload.single("pdf"),
  uploadPdfHandler
);

// Get ALL documents for authenticated user (NEW)
router.get(
  "/documents/all",
  validateUserContext,
  getAllUserDocumentsHandler
);

// Download PDF
router.get(
  "/documents/:documentId/download",
  validateUserContext,
  downloadPdfHandler
);

// Delete PDF (from both Supabase and MongoDB)
router.delete(
  "/documents/:documentId",
  validateUserContext,
  deletePdfHandler
);

// List chat documents
router.get(
  "/chats/:chatId/documents",
  validateUserContext,
  listChatDocumentsHandler
);

export default router;