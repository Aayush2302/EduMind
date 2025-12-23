import mongoose, { Schema , Document } from 'mongoose';

export interface IChat extends Document {
    folderId : mongoose.Schema.Types.ObjectId ;
    title : string ;
    studyMode : "simple" | "detailed" | "interview" ;
    createdAt : Date ;
    updatedAt : Date ;
    isArchived : boolean ;
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
        enum : ["simple", "step", "interview"],
        default : "simple"
    },
    isArchived : {
        type : Boolean,
        default : false
    }
}, { timestamps : true });



export const Chat = mongoose.model<IChat>("Chat", chatSchema);