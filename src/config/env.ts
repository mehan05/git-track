import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const envSchema = z.object({
  GOOGLE_SHEET_ID: z.string().min(1),
  GOOGLE_CLIENT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string().min(1).transform((val) => val.replace(/\\n/g, '\n')),
  GITTRACK_AUTHOR_EMAIL: z.string().email(),
  WATCH_DIRECTORIES: z.string().transform((val) => val.split(',').map((p) => path.resolve(p.trim()))),
  DATABASE_PATH: z.string().default('gittrack.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  GOOGLE_SHEET_NAME: z.string().default('Sheet1'),
  RETRY_INTERVAL_MS: z.coerce.number().default(60000), // 1 minute
  MAX_RETRY_COUNT: z.coerce.number().default(5),
  
  // AI Integration
  GEMINI_API_KEY: z.string().min(1),
  
  // Email Configuration
  MANAGER_EMAIL: z.string().email(),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
export type Env = z.infer<typeof envSchema>;
