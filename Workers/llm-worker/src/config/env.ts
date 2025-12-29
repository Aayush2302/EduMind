import 'dotenv/config';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load correct env file
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

dotenv.config({ path: envFile });

// 1️⃣ Define schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),

  PORT: z.string().default('6379'),
});

// 2️⃣ Parse env
const parsed = envSchema.safeParse(process.env);

// 3️⃣ Fail fast if invalid
if (!parsed.success) {
  console.error('❌ Invalid environment variables');
  console.error(parsed.error.format());
  process.exit(1);
}

// 4️⃣ Export parsed values (REAL STRINGS)
export const env = parsed.data;
