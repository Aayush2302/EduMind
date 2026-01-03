import dotenv from "dotenv";
import { z } from "zod";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: envFile });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),

  MONGO_URI: z.string().min(1),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),


  // 🔑 THIS is the important one
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  SUPABASE_URL : z.string().min(1,"SUPABASE_URL is required"),
  SUPABASE_SERVICE_ROLE_KEY : z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables");
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
