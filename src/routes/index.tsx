import discord, { discordClientId } from '#/libs/discord';
import { getDiscordChannelGame, startDiscordGame } from '#/server/fetch/src/discord';
import { getGameState, passGameMove, playGameMove, type GetGameStateResponse } from '#/server/fetch/src/game';
import { Alert, Button, Chip, Spinner, Typography } from '@heroui/react';
import { createFileRoute } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { PartySocket } from 'partysocket';
import { useEffect, useRef, useState } from 'react';
import { useDiscord } from './-_discord';

function Loading({ label }: { label: string }) {
  const suits = ['♠', '♥', '♦', '♣'];
  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center gap-8 p-8"
      style={{ background: 'radial-gradient(ellipse at center, #047857, #064e3b 70%)' }}
    >
      <div className="flex gap-3">
        {suits.map((s, i) => (
          <span
            key={s}
            className={`flex h-16 w-12 animate-bounce items-center justify-center rounded-lg border border-black/10 bg-white text-3xl shadow-xl ${s === '♥' || s === '♦' ? 'text-red-600' : 'text-neutral-900'}`}
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
          >
            {s}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Spinner size="sm" color="current" className="text-white/80" />
        <Typography.Paragraph className="text-white/90">{label}</Typography.Paragraph>
      </div>
    </div>
  );
}

const SUIT_SYMBOL: Record<string, string> = { diamonds: '♦', clubs: '♣', hearts: '♥', spades: '♠' };
const isRedSuit = (suit: string) => suit === 'diamonds' || suit === 'hearts';

type SeatPlayer = GetGameStateResponse['players'][number];

const discordAvatarUrl = (discordId: string, avatarHash: string | null | undefined) => {
  if (!avatarHash) return null;
  if (avatarHash.startsWith('http')) return avatarHash;
  return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${avatarHash.startsWith('a_') ? 'gif' : 'png'}?size=64`;
};

function PlayerAvatar({ discordId, avatarHash, username }: { discordId: string; avatarHash: string | null | undefined; username: string }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : discordAvatarUrl(discordId, avatarHash);
  if (!src)
    return (
      <div
        title={username}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white"
      >
        {username.charAt(0).toUpperCase()}
      </div>
    );
  return (
    <img
      src={src}
      alt={username}
      title={username}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-10 w-10 rounded-full object-cover"
    />
  );
}

function PlayingCard({ rank, suit, selected, size = 'md' }: { rank: string; suit: string; selected?: boolean; size?: 'sm' | 'md' }) {
  const dims = size === 'sm' ? 'h-14 w-10 p-1 text-xs' : 'h-24 w-16 p-1.5 text-base';
  const symbol = size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <div
      className={`flex ${dims} flex-col justify-between rounded-lg border bg-white shadow-lg ${selected ? 'border-amber-400 ring-2 ring-amber-400' : 'border-black/10'} ${isRedSuit(suit) ? 'text-red-600' : 'text-neutral-900'}`}
    >
      <span className="text-left font-bold leading-none">{rank}</span>
      <span className={`self-center leading-none ${symbol}`}>{SUIT_SYMBOL[suit]}</span>
      <span className="rotate-180 text-left font-bold leading-none">{rank}</span>
    </div>
  );
}

function Seat({ player, isSelf }: { player: SeatPlayer; isSelf?: boolean }) {
  return (
    <div
      className={`flex min-w-28 flex-col items-center gap-1 rounded-xl px-3 py-2 text-center backdrop-blur-sm ${player.isCurrentTurn ? 'bg-amber-400/20 ring-2 ring-amber-400' : 'bg-black/30'}`}
    >
      <PlayerAvatar discordId={player.discordId} avatarHash={player.avatarUrl} username={player.username} />
      {isSelf && <span className="text-xs font-semibold text-white/90">you</span>}
      <span className="text-xs text-white/70">
        {player.handCount} card{player.handCount === 1 ? '' : 's'}
      </span>
      <div className="flex flex-wrap justify-center gap-1">
        {player.isCurrentTurn && (
          <Chip color="accent" variant="soft" size="sm">
            turn
          </Chip>
        )}
        {player.isLockedOut && (
          <Chip color="warning" variant="soft" size="sm">
            passed
          </Chip>
        )}
        {player.placement != null && (
          <Chip color="success" variant="soft" size="sm">
            #{player.placement}
          </Chip>
        )}
      </div>
    </div>
  );
}

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

  if (status === 'loading') return <Loading label="Connecting to Discord…" />;
  if (status === 'error')
    return (
      <div className="p-8">
        <Alert status="danger">
          <Alert.Content>
            <Alert.Title>Failed to connect</Alert.Title>
            <Alert.Description>{error?.message}</Alert.Description>
          </Alert.Content>
        </Alert>
      </div>
    );

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

  if (game === undefined) return <Loading label="Loading game…" />;

  if (game) return <GameBoard channelId={discord.channelId ?? ''} discordId={user?.id ?? ''} tick={tick} />;

  const hostName = players[0]?.global_name ?? players[0]?.nickname ?? players[0]?.username;

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center gap-8 p-6"
      style={{ background: 'radial-gradient(ellipse at center, #047857, #064e3b 70%)' }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex gap-2">
          {['♠', '♥', '♦', '♣'].map((s) => (
            <span
              key={s}
              className={`flex h-12 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-2xl shadow-xl ${s === '♥' || s === '♦' ? 'text-red-600' : 'text-neutral-900'}`}
            >
              {s}
            </span>
          ))}
        </div>
        <Typography.Heading level={1} className="text-white">
          Welcome, {user?.global_name ?? user?.username}
        </Typography.Heading>
        <Typography.Paragraph className="text-white/70">Gather your table and deal the deck.</Typography.Paragraph>
      </div>

      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/30 p-6 shadow-2xl backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <Typography.Heading level={3} className="text-white">
            Players
          </Typography.Heading>
          <Chip color="accent" variant="soft">
            {players.length} in lobby
          </Chip>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {players.map((p) => {
            const name = p.global_name ?? p.nickname ?? p.username;
            const isPlayerHost = players[0]?.id === p.id;
            return (
              <li
                key={p.id}
                className={`flex flex-col items-center gap-2 rounded-xl p-3 ${p.id === user?.id ? 'bg-amber-400/15 ring-1 ring-amber-400/50' : 'bg-white/5'}`}
              >
                <PlayerAvatar discordId={p.id} avatarHash={p.avatar} username={name} />
                <span className="max-w-full truncate text-sm font-medium text-white">{name}</span>
                {isPlayerHost && (
                  <Chip color="accent" variant="soft" size="sm">
                    host
                  </Chip>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button size="lg" variant="primary" onPress={onLaunch} isDisabled={!isHost || launch.status === 'launching'}>
          {launch.status === 'launching' ? 'Dealing…' : 'Deal & Start'}
        </Button>
        {!isHost && (
          <Typography.Paragraph size="sm" className="text-white/70">
            Waiting for {hostName} to start the game…
          </Typography.Paragraph>
        )}
      </div>

      {launch.status === 'error' && (
        <div className="w-full max-w-lg">
          <Alert status="danger">
            <Alert.Content>
              <Alert.Title>Failed to launch</Alert.Title>
              <Alert.Description>{launch.error}</Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}
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

  if (!state) return <Loading label="Loading game…" />;

  const self = state.players.find((p) => p.discordId === props.discordId);
  const others = state.players.filter((p) => p.discordId !== props.discordId);
  const currentTurnPlayer = state.players.find((p) => p.isCurrentTurn);
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
    <div className="flex min-h-screen w-full flex-col bg-neutral-950 p-4">
      {(isObserver || error) && (
        <div className="mx-auto mb-4 flex w-full max-w-2xl flex-col gap-2">
          {isObserver && (
            <Alert status="accent">
              <Alert.Content>
                <Alert.Description>This game already started — you're observing and can't play.</Alert.Description>
              </Alert.Content>
            </Alert>
          )}
          {error && (
            <Alert status="danger">
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          )}
        </div>
      )}

      <div className="relative mx-auto flex w-full max-w-5xl flex-1 items-center justify-center">
        <div
          className="absolute inset-2 rounded-[45%] border-8 border-amber-950/70 shadow-2xl sm:inset-6"
          style={{ background: 'radial-gradient(ellipse at center, #047857, #064e3b 70%)' }}
        />

        <div className="absolute inset-x-0 top-4 z-10 flex flex-wrap justify-center gap-3 px-6 sm:top-8">
          {others.map((p) => (
            <Seat key={p.seat} player={p} isSelf={p.discordId === props.discordId} />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-3">
          {state.currentPlay ? (
            <>
              <div className="flex">
                {state.currentPlay.cards?.map((c, i) => (
                  <div key={`${c.rank}-${c.suit}-${i}`} className="-ml-4 first:ml-0">
                    <PlayingCard rank={c.rank} suit={c.suit} />
                  </div>
                ))}
              </div>
              <Chip color="default" variant="soft">
                {state.currentPlay.type}
              </Chip>
            </>
          ) : (
            canAct && (
              <span className="rounded-full bg-black/40 px-5 py-2 text-sm text-white/80 backdrop-blur-sm">
                Free play — any valid combination
              </span>
            )
          )}

          {currentTurnPlayer && currentTurnPlayer.discordId !== props.discordId && (
            <span className="rounded-full bg-black/40 px-5 py-2 text-sm text-white/80 backdrop-blur-sm">
              Waiting for {currentTurnPlayer.username} to play…
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 pt-4">
        {self && <Seat player={self} isSelf />}

        {!isObserver && (
          <>
            <div className="flex min-h-24 items-end justify-center">
              {state.hand.map((c) => {
                const isSel = selected.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={isSel}
                    disabled={!canAct}
                    onClick={() => toggleCard(c.id)}
                    className={`-ml-4 transition-transform duration-150 first:ml-0 focus:outline-none disabled:cursor-not-allowed ${isSel ? '-translate-y-5' : 'enabled:hover:-translate-y-3'}`}
                  >
                    <PlayingCard rank={c.rank} suit={c.suit} selected={isSel} />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="primary" onPress={onPlay} isDisabled={!canAct || selected.length === 0}>
                Play{selected.length ? ` (${selected.length})` : ''}
              </Button>
              <Button variant="secondary" onPress={onPass} isDisabled={!canAct}>
                Pass
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
