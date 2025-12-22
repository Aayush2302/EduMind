// src/config/db.ts
import mongoose from 'mongoose';
import { env } from './env.js';
import { AppError } from '../utils/AppError.js';


export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    new AppError('❌ MongoDB connection error', 500);
    process.exit(1);
  }
}
