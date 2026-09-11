import discord, { discordClientId, discordClientScopes } from '#/libs/discord';
import { getDiscordAccessToken } from '#/server/fetch/src/discord';
import type { DiscordSDK } from '@discord/embedded-app-sdk';
import { useServerFn } from '@tanstack/react-start';
import { usePartySocket } from 'partysocket/react';
import { createContext, use, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

export type DiscordUser = Awaited<ReturnType<DiscordSDK['commands']['authenticate']>>['user'];
export type DiscordParticipant = Awaited<ReturnType<DiscordSDK['commands']['getInstanceConnectedParticipants']>>['participants'][number];
export type DiscordStatus = 'loading' | 'ready' | 'error';
export type UseDiscordRealtimeProps = { channelId: string | undefined; onUpdate: () => void };

export type DiscordContextValue = {
  status: DiscordStatus;
  user: DiscordUser | null;
  participants: Array<DiscordParticipant>;
  error: Error | null;
};

export const DiscordContext = createContext<DiscordContextValue | null>(null);
export function useDiscord() {
  const context = use(DiscordContext);
  if (!context) throw new Error('useDiscord must be used within a DiscordContext provider');
  return { ...context, ready: context.status === 'ready' && !!discord.channelId && !!discord.guildId };
}

export const useDiscordRealtime = ({ channelId, onUpdate }: UseDiscordRealtimeProps) =>
  usePartySocket({
    host: `${discordClientId}.discordsays.com`,
    prefix: '.proxy/parties',
    party: 'game-channel-durable-object',
    room: channelId,
    onMessage(event) {
      const message = z.object({ type: z.string() }).safeParse(JSON.parse(event.data));
      if (message.success && message.data.type === 'update') onUpdate();
    },
  });

export function DiscordProvider(props: { children: React.ReactNode }) {
  const started = useRef(false);
  const useGetDiscordAccessTokenServerFn = useServerFn(getDiscordAccessToken);
  const [state, setState] = useState<DiscordContextValue>({ status: 'loading', user: null, participants: [], error: null });

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
        const { access_token } = await useGetDiscordAccessTokenServerFn({ data: { code } });
        const { user } = await discord.commands.authenticate({ access_token });

        const { participants } = await discord.commands.getInstanceConnectedParticipants();
        setState({ status: 'ready', user, participants, error: null });

        discord.subscribe('ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE', ({ participants }) => setState((prev) => ({ ...prev, participants })));
      } catch (error) {
        const message = error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
        setState({ status: 'error', user: null, participants: [], error: new Error(message) });
      }
    })();
  }, []);

  return <DiscordContext value={state} {...props} />;
}
