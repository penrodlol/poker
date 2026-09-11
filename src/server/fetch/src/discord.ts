import { logError } from '#/server/utils/logger';
import { createServerFn } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { z } from 'zod';

export type GetDiscordAccessTokenRequest = z.infer<typeof getDiscordAccessTokenRequestSchema>;
export type GetDiscordAccessTokenResponse = NonNullable<Awaited<ReturnType<typeof getDiscordAccessToken>>>;

export const GET_DISCORD_ACCESS_TOKEN_FETCH_TOKEN_ERROR = 'Discord Fetch Token Failed';
export const GET_DISCORD_ACCESS_TOKEN_ERROR = 'Discord Authentication Failed';
export const GET_DISCORD_CHANNEL_GAME_ERROR = 'Discord Get Channel Game Failed';

export const getDiscordAccessTokenRequestSchema = z.object({ code: z.string().min(1) });

export const getDiscordAccessToken = createServerFn({ method: 'POST' })
  .validator(getDiscordAccessTokenRequestSchema)
  .handler(async ({ data }) => {
    try {
      const discordAccessTokenResponse = await fetch(env.DISCORD_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.VITE_DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: data.code,
        }),
      });
      if (!discordAccessTokenResponse.ok)
        throw new Error(`${GET_DISCORD_ACCESS_TOKEN_FETCH_TOKEN_ERROR}: ${discordAccessTokenResponse.status}`);
      const { access_token } = z.object({ access_token: z.string() }).parse(await discordAccessTokenResponse.json());

      return { access_token };
    } catch (error) {
      logError(GET_DISCORD_ACCESS_TOKEN_ERROR, { error });
      throw new Error(GET_DISCORD_ACCESS_TOKEN_ERROR);
    }
  });
