import { DiscordSDK } from '@discord/embedded-app-sdk';
import { z } from 'zod';

const discordClientId = z.string().parse(import.meta.env.VITE_DISCORD_CLIENT_ID);

const discordGlobal = globalThis as typeof globalThis & { discord?: DiscordSDK };

export const proxyDiscordUrl = (path: string) => new URL(path, `https://${discordClientId}.discordsays.com`).toString();
export default (discordGlobal.discord ??= new DiscordSDK(discordClientId));
