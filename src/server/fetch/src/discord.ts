import { logError } from '#/server/utils/logger';
import { createServerFn } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { z } from 'zod';

export const TOKEN_EXCHANGE_ERROR = 'Discord Token Exchange Failed';

const tokenSchema = z.object({ access_token: z.string() });

export const exchangeDiscordToken = createServerFn({ method: 'POST' })
  .validator(z.object({ code: z.string().min(1) }))
  .handler(async ({ data }) => {
    try {
      const response = await fetch(env.DISCORD_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.VITE_DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: data.code,
        }),
      });
      if (!response.ok) throw new Error(`${TOKEN_EXCHANGE_ERROR}: ${response.status}`);
      return tokenSchema.parse(await response.json());
    } catch (error) {
      logError(TOKEN_EXCHANGE_ERROR, { error });
      throw new Error(TOKEN_EXCHANGE_ERROR);
    }
  });
