// src/models/Document.ts
import mongoose, { Schema, Document as MongoDocument } from "mongoose";

export interface IDocument extends MongoDocument {
  ownerId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  fileName: string;
  storagePath: string;
  size: number;
  mimeType: string;
  status: "uploaded" | "processing" | "processed" | "failed";
  extractedText?: string;
  pageCount?: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
      unique: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      default: "application/pdf",
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "processed", "failed"],
      default: "uploaded",
    },
    extractedText: {
      type: String,
      default: "",
    },
    pageCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      title: String,
      author: String,
      subject: String,
      keywords: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
documentSchema.index({ ownerId: 1, createdAt: -1 });
documentSchema.index({ chatId: 1, createdAt: -1 });

export const DocumentModel = mongoose.model<IDocument>("Document", documentSchema);