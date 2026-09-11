import discord from '#/libs/discord';
import { gameStateQueryKey, getGameStateQueryOptions, passGameMove, playGameMove, startGame } from '#/server/fetch/src/game';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { useDiscord, useDiscordRealtime } from './-_discord';
import GameBoard from './-_game-board';
import GameSplashscreen from './-_game-splashscreen';
import GameStart from './-_game-start';

export const Route = createFileRoute('/')({ component: HomePage });

function HomePage() {
  const { ready, user } = useDiscord();
  const { isLoading } = useQuery(getGameStateQueryOptions({ discordId: user?.id ?? '', channelId: discord.channelId ?? '' }, ready));

  if (!ready || isLoading) return <GameSplashscreen loadingMessage={ready ? 'Loading Game...' : 'Connecting to Discord...'} />;

  return <HomePageGameShell userId={user?.id ?? ''} guildId={discord.guildId ?? ''} channelId={discord.channelId ?? ''} />;
}

function HomePageGameShell({ userId, guildId, channelId }: { userId: string; guildId: string; channelId: string }) {
  const { participants } = useDiscord();
  const queryClient = useQueryClient();

  const useStartGameServerFn = useServerFn(startGame);
  const usePlayGameMoveServerFn = useServerFn(playGameMove);
  const usePassGameMoveServerFn = useServerFn(passGameMove);

  const [isStarting, setIsStarting] = useState(false);

  const { data } = useQuery(getGameStateQueryOptions({ discordId: userId, channelId }));

  const { mutate: handleStartGame } = useMutation({
    onError: () => setIsStarting(false),
    mutationFn: () => {
      const players = participants
        .filter((p) => !p.bot)
        .map((p) => ({ discordId: p.id, username: p.global_name ?? p.nickname ?? p.username, avatarUrl: p.avatar }));
      return useStartGameServerFn({ data: { channelId, guildId, players } });
    },
  });

  const { mutate: handlePlayGameMove } = useMutation({
    mutationFn: ({ cardIds }: { cardIds: Array<string> }) => usePlayGameMoveServerFn({ data: { channelId, discordId: userId, cardIds } }),
  });

  const { mutate: handlePassGameMove } = useMutation({
    mutationFn: () => usePassGameMoveServerFn({ data: { channelId, discordId: userId } }),
  });

  useDiscordRealtime({
    channelId,
    onUpdate: () => queryClient.invalidateQueries({ queryKey: gameStateQueryKey({ discordId: userId, channelId }) }),
  });

  if (data?.status === 'found')
    return (
      <GameBoard
        game={data.data}
        onPlay={(cardIds, onError) => handlePlayGameMove({ cardIds }, { onError })}
        onPass={(onSettled) => handlePassGameMove(undefined, { onSettled })}
      />
    );

  return <GameStart isPending={isStarting} onStartGame={() => (setIsStarting(true), handleStartGame())} />;
}
