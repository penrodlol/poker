import discord from '#/libs/discord';
import { getDiscordChannelGame, startDiscordGame } from '#/server/fetch/src/discord';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useState } from 'react';
import { useDiscord } from './-_discord';

export const Route = createFileRoute('/')({ component: Home });

type ChannelGame = Awaited<ReturnType<typeof getDiscordChannelGame>>;

function Home() {
  const { status, user, participants, error } = useDiscord();
  const useGetChannelGameServerFn = useServerFn(getDiscordChannelGame);
  const useStartGameServerFn = useServerFn(startDiscordGame);
  const [game, setGame] = useState<ChannelGame | undefined>(undefined);
  const [launch, setLaunch] = useState<{ status: 'idle' | 'launching' | 'error'; error?: string }>({ status: 'idle' });

  useEffect(() => {
    if (status !== 'ready' || !discord.channelId) return;
    useGetChannelGameServerFn({ data: { channelId: discord.channelId } }).then(setGame);
  }, [status]);

  if (status === 'loading') return <p className="p-8 text-lg">Connecting to Discord…</p>;
  if (status === 'error') return <p className="p-8 text-lg">Failed to connect: {error?.message}</p>;

  const players = participants.filter((p) => !p.bot);
  const isHost = players[0]?.id === user?.id;

  async function onLaunch() {
    if (!discord.guildId || !discord.channelId) return setLaunch({ status: 'error', error: 'Missing guild or channel' });
    setLaunch({ status: 'launching' });
    try {
      await useStartGameServerFn({
        data: {
          guildId: discord.guildId,
          channelId: discord.channelId,
          players: players.map((p) => ({ discordId: p.id, username: p.global_name ?? p.nickname ?? p.username, avatarUrl: p.avatar })),
        },
      });
      setGame(await useGetChannelGameServerFn({ data: { channelId: discord.channelId } }));
      setLaunch({ status: 'idle' });
    } catch (err) {
      setLaunch({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (game === undefined) return <p className="p-8 text-lg">Loading game…</p>;

  if (game) {
    const isObserver = !game.players.some((p) => p.discordId === user?.id);
    return (
      <div className="p-8">
        <h1 className="text-4xl font-bold">Game in progress</h1>
        {isObserver && <p className="mt-2 text-sm">This game already started — you're observing and can't play.</p>}
        <h2 className="mt-6 text-2xl font-semibold">Players ({game.players.length})</h2>
        <ul>
          {game.players.map((p) => (
            <li key={p.seat}>
              {p.seat + 1}. {p.username}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome, {user?.global_name ?? user?.username}</h1>

      <h2 className="mt-6 text-2xl font-semibold">Connected players ({players.length})</h2>
      <ul>
        {players.map((p) => (
          <li key={p.id}>{p.global_name ?? p.nickname ?? p.username}</li>
        ))}
      </ul>

      <button className="mt-6 border px-4 py-2" onClick={onLaunch} disabled={!isHost || launch.status === 'launching'}>
        {launch.status === 'launching' ? 'Launching…' : 'Launch'}
      </button>
      {!isHost && (
        <p className="mt-2 text-sm">Only {players[0]?.global_name ?? players[0]?.nickname ?? players[0]?.username} can start the game.</p>
      )}
      {launch.status === 'error' && <p className="mt-2 text-red-500">Failed to launch: {launch.error}</p>}
    </div>
  );
}
