import { DiscordSDK } from '@discord/embedded-app-sdk';
import { z } from 'zod';

export const discordClientId = z.string().parse(import.meta.env.VITE_DISCORD_CLIENT_ID);
export const discordClientScopes = z
  .string()
  .transform((v) => v.split('|') as Parameters<DiscordSDK['commands']['authorize']>[0]['scope'])
  .parse(import.meta.env.VITE_DISCORD_CLIENT_SCOPES);

export const discordGlobal = globalThis as typeof globalThis & { discord?: DiscordSDK };

export const proxyDiscordUrl = (path: string) => new URL(path, `https://${discordClientId}.discordsays.com`).toString();
export default (discordGlobal.discord ??= new DiscordSDK(discordClientId));
