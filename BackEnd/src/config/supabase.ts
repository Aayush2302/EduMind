// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Supabase Admin Client
 * Uses service_role key to bypass RLS
 * ONLY use on backend - never expose to frontend
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('✅ Supabase Admin Client initialized');