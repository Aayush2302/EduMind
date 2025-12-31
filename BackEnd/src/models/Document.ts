// src/models/Document.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
  ownerId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  fileName: string;
  storagePath: string;
  size: number;
  mimeType: string;
  status: "uploaded" | "processing" | "processed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    fileName: { type: String, required: true },
    storagePath: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ["uploaded", "processing", "processed", "failed"],
      default: "uploaded",
    },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>(
  "Document",
  documentSchema
);