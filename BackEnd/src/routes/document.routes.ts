// src/routes/document.routes.ts
import { Router } from "express";
import {
  uploadPdfHandler,
  downloadPdfHandler,
  deletePdfHandler,
  listChatDocumentsHandler,
} from "../modules/documents/document.controller.js";
import { pdfUpload } from "../middleware/uploadPdf.js";
import { validateUserContext } from "../middleware/validateUserContext.js";

const router = Router();

// Upload PDF
router.post(
  "/documents/upload",
  validateUserContext,
  pdfUpload.single("pdf"),
  uploadPdfHandler
);

// Download PDF
router.get(
  "/documents/:documentId/download",
  validateUserContext,
  downloadPdfHandler
);

// Delete PDF
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