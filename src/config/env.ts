import { config } from "dotenv";
import { z } from "zod";

config({ path: `.env` });

console.log("🔐 Loading environment variables...");

const serverSchema = z.object({
  // Database
  PORT: z.coerce.number().min(1),
  DATABASE_URL: z.string().min(1),
  GOOGLE_MAPS_API_KEY: z.string().min(1),

  // Supabase
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(1),
});

const _serverEnv = serverSchema.safeParse(process.env);

if (!_serverEnv.success) {
  console.error("❌ Invalid environment variables:\n");
  _serverEnv.error.issues.forEach((issue) => {
    console.error(issue);
  });
  throw new Error("Invalid environment variables");
}

const {
  PORT,
  DATABASE_URL,
  GOOGLE_MAPS_API_KEY,
  SUPABASE_SERVICE_ROLE,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  JWT_SECRET,
} = _serverEnv.data;

export const env = {
  PORT,
  DATABASE_URL,
  SUPABASE_SERVICE_ROLE,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  JWT_SECRET,
  GOOGLE_MAPS_API_KEY,
};

console.log("✅  Environment variables loaded");
