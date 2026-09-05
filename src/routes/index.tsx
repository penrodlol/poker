import discord, { discordClientId } from '#/libs/discord';
import { getDiscordChannelGame, startDiscordGame } from '#/server/fetch/src/discord';
import { getGameState, passGameMove, playGameMove, type GetGameStateResponse } from '#/server/fetch/src/game';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { PartySocket } from 'partysocket';
import { useEffect, useRef, useState } from 'react';
import { useDiscord } from './-_discord';

export function useGameSocket(channelId: string | undefined, onUpdate: () => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!channelId) return;
    const socket = new PartySocket({
      host: `${discordClientId}.discordsays.com`,
      prefix: '.proxy/parties',
      party: 'game-channel-durable-object',
      room: channelId,
    });
    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data) as { type?: string };
        if (message.type === 'update') onUpdateRef.current();
      } catch {}
    });
    return () => socket.close();
  }, [channelId]);
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export const Route = createFileRoute('/')({ component: Home });

type ChannelGame = Awaited<ReturnType<typeof getDiscordChannelGame>>;

function Home() {
  const { status, user, participants, error } = useDiscord();
  const useGetChannelGameServerFn = useServerFn(getDiscordChannelGame);
  const useStartGameServerFn = useServerFn(startDiscordGame);
  const [game, setGame] = useState<ChannelGame | undefined>(undefined);
  const [tick, setTick] = useState(0);
  const [launch, setLaunch] = useState<{ status: 'idle' | 'launching' | 'error'; error?: string }>({ status: 'idle' });

  const refreshChannelGame = () => {
    if (!discord.channelId) return;
    useGetChannelGameServerFn({ data: { channelId: discord.channelId } }).then(setGame);
  };

  useEffect(() => {
    if (status !== 'ready') return;
    refreshChannelGame();
  }, [status]);

  useGameSocket(status === 'ready' ? (discord.channelId ?? undefined) : undefined, () => {
    refreshChannelGame();
    setTick((t) => t + 1);
  });

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

  if (game) return <GameBoard channelId={discord.channelId ?? ''} discordId={user?.id ?? ''} tick={tick} />;

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

function GameBoard(props: { channelId: string; discordId: string; tick: number }) {
  const useGetGameStateServerFn = useServerFn(getGameState);
  const usePlayGameMoveServerFn = useServerFn(playGameMove);
  const usePassGameMoveServerFn = useServerFn(passGameMove);
  const [state, setState] = useState<GetGameStateResponse | null>(null);
  const [selected, setSelected] = useState<Array<string>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () =>
    useGetGameStateServerFn({ data: { channelId: props.channelId, discordId: props.discordId } })
      .then(setState)
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => {
    refresh();
  }, [props.tick]);

  if (!state) return <p className="p-8 text-lg">Loading game…</p>;

  const self = state.players.find((p) => p.discordId === props.discordId);
  const isObserver = !self;
  const isMyTurn = self?.isCurrentTurn ?? false;
  const isFinished = self?.placement != null;
  const canAct = isMyTurn && !isObserver && !isFinished && !busy;

  const toggleCard = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  async function onPlay() {
    setBusy(true);
    setError(null);
    try {
      await usePlayGameMoveServerFn({ data: { channelId: props.channelId, discordId: props.discordId, cardIds: selected } });
      setSelected([]);
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function onPass() {
    setBusy(true);
    setError(null);
    try {
      await usePassGameMoveServerFn({ data: { channelId: props.channelId, discordId: props.discordId } });
      await refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Game in progress</h1>
      {isObserver && <p className="mt-2 text-sm">This game already started — you're observing and can't play.</p>}

      <h2 className="mt-6 text-2xl font-semibold">Players ({state.players.length})</h2>
      <ul>
        {state.players.map((p) => (
          <li key={p.seat}>
            {p.seat + 1}. {p.username} — {p.handCount} card(s)
            {p.isCurrentTurn && ' ← turn'}
            {p.isLockedOut && ' (passed)'}
            {p.placement != null && ` (finished #${p.placement})`}
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-2xl font-semibold">Table</h2>
      {state.currentPlay ? (
        <p>
          {state.currentPlay.type}: {state.currentPlay.cards?.map((c) => `${c.rank} of ${c.suit}`).join(', ')}
        </p>
      ) : (
        <p>Free play — any valid combination.</p>
      )}

      <h2 className="mt-6 text-2xl font-semibold">Your hand ({state.hand.length})</h2>
      <ul>
        {state.hand.map((c) => (
          <li key={c.id}>
            <label>
              <input type="checkbox" checked={selected.includes(c.id)} disabled={!canAct} onChange={() => toggleCard(c.id)} /> {c.rank} of{' '}
              {c.suit}
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex gap-2">
        <button className="border px-4 py-2" onClick={onPlay} disabled={!canAct || selected.length === 0}>
          Play
        </button>
        <button className="border px-4 py-2" onClick={onPass} disabled={!canAct}>
          Pass
        </button>
      </div>

      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
}
