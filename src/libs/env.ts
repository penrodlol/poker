import { z } from 'zod';

const clientEnvSchema = z.object({ VITE_DISCORD_CLIENT_ID: z.string() });

const serverEnvSchema = z.object({
  CLOUDFLARE_ACCOUNT_ID: z.string(),
  CLOUDFLARE_D1_ID: z.string(),
  CLOUDFLARE_API_ACCESS_TOKEN: z.string(),
  DISCORD_CLIENT_SECRET: z.string(),
  DISCORD_FRAME_ANCESTORS: z.string(),
});

export const clientEnv = clientEnvSchema.parse(import.meta.env);

export const getServerEnv = () => serverEnvSchema.parse(process.env);
