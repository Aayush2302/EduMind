import mongoose, {Schema, Document} from 'mongoose';

export interface ISubjectFolder extends Document {
    ownerId : string;
    name : string;
    description?: string;
    isDeleted : boolean;
    createdAt : Date;
    updatedAt : Date;
    chatCount?: number; // Virtual field
}

const subjectFolderSchema = new Schema<ISubjectFolder>(
    {
        ownerId: {
            type : String,
            ref : 'User',
            required : true,
            index : true
        },
        name: {
            type : String,
            required : true
        },
        description: {
            type : String
        },
        isDeleted : {
            type: Boolean,
            default : false,
        }
    },
    { 
        timestamps : true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual field to count chats in this folder
subjectFolderSchema.virtual('chatCount', {
    ref: 'Chat',
    localField: '_id',
    foreignField: 'folderId',
    count: true
});

// Indexes for better query performance
subjectFolderSchema.index({ ownerId: 1, isDeleted: 1 });

export const SubjectFolder = mongoose.model<ISubjectFolder>(
    "SubjectFolder", subjectFolderSchema
);