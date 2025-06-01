import { z } from "zod";

const envSchema = z.object({
  // Authentication
  NEXTAUTH_SECRET: z
    .string()
    .min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // Node Environment
  NODE_ENV: z.enum(["development", "test", "production"]),

  // Optional Analytics
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().optional(),
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

// Validate environment variables at startup
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:", error.errors);
    } else {
      console.error("❌ Environment validation failed:", error);
    }
    throw new Error(
      "Environment validation failed. Please check your .env file."
    );
  }
}

export const env = validateEnv();

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;

// Helper to check if we're in production
export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
