// rag-worker/src/models/Document.ts
import mongoose, { Schema, Document as MongoDocument } from "mongoose";

export interface IDocument extends MongoDocument {
  ownerId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  fileName: string;
  storagePath: string;
  size: number;
  status: "uploaded" | "processing" | "processed" | "failed";
  pageCount?: number;
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
    status: {
      type: String,
      enum: ["uploaded", "processing", "processed", "failed"],
      default: "uploaded",
    },
    pageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>("Document", documentSchema);