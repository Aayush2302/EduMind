import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    chatId: Schema.Types.ObjectId,
    sender: String,
    content: String,
    status: String,
    parentMessageId: Schema.Types.ObjectId,
    studyMode: String,
    constraintMode: String
    
  },
  
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
