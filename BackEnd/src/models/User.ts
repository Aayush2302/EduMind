import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;

  authProviders: {
    local?: {
      passwordHash: string;
    };
    google?: {
      googleId: string;
    };
  };

  role: 'student' | 'admin' | 'enterprise';
  status: 'active' | 'blocked';

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    authProviders: {
      local: {
        passwordHash: { type: String }
      },
      google: {
        googleId: { type: String }
      }
    },

    role: {
      type: String,
      enum: ['student', 'admin', 'enterprise'],
      default: 'student'
    },

    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active'
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
