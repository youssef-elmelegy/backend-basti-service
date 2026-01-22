import { z } from 'zod';
import { config } from 'dotenv';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['silent', 'error', 'warn', 'info', 'debug']).default('info'),

  // Database
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string().min(1, 'DB_USERNAME is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_DATABASE: z.string().min(1, 'DB_DATABASE is required'),
  DB_SSL: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET must be provided'),
  JWT_ACCESS_EXPIRES_IN: z.coerce.number().default(15 * 60), // 15 minutes in seconds
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be provided'),
  JWT_REFRESH_EXPIRES_IN: z.coerce.number().default(7 * 24 * 60 * 60), // 7 days in seconds
  JWT_SETUP_PROFILE_EXPIRES_IN: z.coerce.number().default(10 * 60), // 10 minutes in seconds
  JWT_RESET_PASSWORD_EXPIRES_IN: z.coerce.number().default(60 * 60), // 1 hour in seconds

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  // CORS
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    ),

  // Email / SMTP
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  MAIL_FROM_NAME: z.string().min(1, 'MAIL_FROM_NAME is required'),
  MAIL_FROM: z.string().min(1, 'MAIL_FROM is required'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 4));
  throw new Error('Invalid environment variables');
}

// We'll export a normalized `env` (with DATABASE_URL) below. Do not export
// the raw parsed data directly to ensure DATABASE_URL is always present.
// Normalize / build DATABASE_URL from separate fields so the app always has a
// canonical connection string regardless of whether DATABASE_URL was set.
function buildDatabaseUrl(data: z.infer<typeof envSchema>) {
  const user = encodeURIComponent(data.DB_USERNAME);
  const pass = encodeURIComponent(data.DB_PASSWORD);
  const host = data.DB_HOST;
  const port = data.DB_PORT ? `:${data.DB_PORT}` : '';
  const db = encodeURIComponent(data.DB_DATABASE);

  const params = new URLSearchParams();
  if (data.DB_SSL) {
    // Common Postgres params; adjust for your provider if needed
    params.set('sslmode', 'require');
    params.set('channel_binding', 'require');
  }

  const query = params.toString();
  return `postgresql://${user}:${pass}@${host}${port}/${db}${query ? `?${query}` : ''}`;
}

export type Env = z.infer<typeof envSchema>;
export type EnvWithDbUrl = Env & { DATABASE_URL: string };

const databaseUrl = buildDatabaseUrl(parsed.data);

export const env: EnvWithDbUrl = {
  ...parsed.data,
  DATABASE_URL: databaseUrl,
};
