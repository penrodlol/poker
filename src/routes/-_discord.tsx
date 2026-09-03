import discord, { discordClientId, discordClientScopes } from '#/libs/discord';
import { exchangeDiscordToken } from '#/server/fetch/src/discord';
import type { DiscordSDK } from '@discord/embedded-app-sdk';
import { useServerFn } from '@tanstack/react-start';
import { createContext, use, useEffect, useRef, useState } from 'react';

export type DiscordUser = Awaited<ReturnType<DiscordSDK['commands']['authenticate']>>['user'];
export type DiscordStatus = 'loading' | 'ready' | 'error';

export type DiscordContextValue = { status: DiscordStatus; user: DiscordUser | null; error: Error | null };
export const DiscordContext = createContext<DiscordContextValue | null>(null);
export function useDiscord() {
  const context = use(DiscordContext);
  if (!context) throw new Error('useDiscord must be used within a DiscordContext provider');
  return context;
}

export function DiscordProvider(props: { children: React.ReactNode }) {
  const started = useRef(false);
  const useExchangeDiscordToken = useServerFn(exchangeDiscordToken);
  const [state, setState] = useState<DiscordContextValue>({ status: 'loading', user: null, error: null });

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        await discord.ready();
        const { code } = await discord.commands.authorize({
          client_id: discordClientId,
          response_type: 'code',
          prompt: 'none',
          scope: discordClientScopes,
        });
        const { access_token } = await useExchangeDiscordToken({ data: { code } });
        const { user } = await discord.commands.authenticate({ access_token });
        setState({ status: 'ready', user, error: null });
      } catch (error) {
        console.error('Discord auth failed', error);
        const message = error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
        setState({ status: 'error', user: null, error: new Error(message) });
      }
    })();
  }, []);

  return <DiscordContext value={state} {...props} />;
}
