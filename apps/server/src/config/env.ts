import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  OPENAI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(['openai', 'claude', 'gemini', 'ollama']).default('gemini'),
  AI_MODEL: z.string().default('gemini-2.5-flash'),

  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3'),

  QUEUE_CONCURRENCY: z.coerce.number().default(3),
  JOB_TIMEOUT: z.coerce.number().default(120000),
  JOB_MAX_RETRIES: z.coerce.number().default(3),

  PDF_STORAGE_PATH: z.string().default('./storage/pdfs'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
