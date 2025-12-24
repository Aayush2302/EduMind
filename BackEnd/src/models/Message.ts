import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  sender: "user" | "assistant";
  content: string;
  status: "completed" | "processing" | "failed";
  createdAt: Date;
  updatedAt: Date;
  parentMessageId?: mongoose.Types.ObjectId;
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
  default: ""
},

    status: {
      type: String,
      enum: ["completed", "processing", "failed"],
      default: "completed"
    },

    parentMessageId: {
  type: Schema.Types.ObjectId,
  ref: "Message"
}

  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>("Message", messageSchema);
