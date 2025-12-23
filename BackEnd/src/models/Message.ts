import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: "user" | "assistant";
  content: string;
  status: "completed" | "processing" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true
    },

    sender: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },

    content: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["completed", "processing", "failed"],
      default: "completed"
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>("Message", messageSchema);
