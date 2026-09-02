import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  driver: 'd1-http',
  verbose: true,
  strict: true,
  dbCredentials: {
    accountId: z.string().parse(process.env.CLOUDFLARE_ACCOUNT_ID),
    databaseId: z.string().parse(process.env.CLOUDFLARE_D1_ID),
    token: z.string().parse(process.env.CLOUDFLARE_API_ACCESS_TOKEN),
  },
});
