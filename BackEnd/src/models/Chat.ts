import mongoose, { Schema , Document } from 'mongoose';

export interface IChat extends Document {
    folderId : mongoose.Schema.Types.ObjectId ;
    title : string ;
    studyMode: "simple" | "interview" | "step-by-step";
    createdAt : Date ;
    updatedAt : Date ;
    isArchived : boolean ;
    constraintMode : "allowed" | "strict" ;
}

const chatSchema = new Schema<IChat>({
    folderId : {
        type : Schema.Types.ObjectId,
        ref : 'SubjectFolder',
        required : true,
        index : true
    },
    title : {
        type : String,
        required : true
    },
studyMode : {
    type : String,
    enum : ["simple", "interview", "step-by-step"],
    default : "simple"
},
isArchived : {
    type : Boolean,
    default : false
},
constraintMode: {
    type: String,
    enum: ["allowed", "strict"],
    default: "allowed"
}

}, { timestamps : true });



export const Chat = mongoose.model<IChat>("Chat", chatSchema);