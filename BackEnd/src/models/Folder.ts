import mongoose, {Schema, Document} from 'mongoose';

export interface ISubjectFolder extends Document {
    ownerId : string;
    name : string;
    description?: string;
    isDeleted : boolean;
    createdAt : Date;
    updatedAt : Date;
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
    { timestamps : true }
)

export const SubjectFolder = mongoose.model<ISubjectFolder>(
    "SubjectFolder", subjectFolderSchema
);