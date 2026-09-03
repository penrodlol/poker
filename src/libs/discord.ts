import { DiscordSDK } from '@discord/embedded-app-sdk';
import { clientEnv } from './env';

const discordGlobal = globalThis as typeof globalThis & { discord?: DiscordSDK };

export const proxyDiscordUrl = (path: string) => new URL(path, `https://${clientEnv.VITE_DISCORD_CLIENT_ID}.discordsays.com`).toString();
export default (discordGlobal.discord ??= new DiscordSDK(clientEnv.VITE_DISCORD_CLIENT_ID));
