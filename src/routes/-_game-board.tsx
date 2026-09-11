import PlayerAvatar from '#/components/player-avatar';
import PlayingCard from '#/components/playing-card';
import { useResizeObserver } from '#/libs/hooks';
import type { GetGameStateResponse } from '#/server/fetch/src/game';
import { sortGameCards } from '#/server/utils/game';
import { Badge, Button, Chip, cn, Spinner, Surface, toast, Tooltip, Typography } from '@heroui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export type GameBoardProps = {
  game: NonNullable<GetGameStateResponse['data']>;
  onPlay: (playingCardIds: Array<string>, onError: () => void) => void;
  onPass: (onSettled: () => void) => void;
};

export default function GameBoard({ game, onPlay, onPass }: GameBoardProps) {
  const observerToastRef = useRef<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableSize = useResizeObserver(tableRef);

  const [selectedPlayingCardIds, setSelectedPlayingCardIds] = useState<Array<string>>([]);
  const [playedPlayingCardIds, setPlayedPlayingCardIds] = useState<Array<string>>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPassing, setIsPassing] = useState(false);

  const currentPlayCards = (game.currentPlay?.cards ?? []).map((c) => `${c.suit}-${c.rank}`).join(',');
  const playerHand = useMemo(() => game.hand.filter((c) => !playedPlayingCardIds.includes(c.id)), [game.hand, playedPlayingCardIds]);

  useEffect(() => {
    setPlayedPlayingCardIds([]);
    setIsPlaying(false);
    if (!game.player?.isCurrentTurn) setSelectedPlayingCardIds([]);
  }, [currentPlayCards, game.player?.isCurrentTurn]);

  useEffect(() => {
    if (!game.isObserver) return;
    if (!observerToastRef.current) {
      const id = toast('You are in observer mode', {
        actionProps: { children: 'Dismiss', onPress: () => toast.close(id), variant: 'tertiary' },
        description: 'The game started and players have their seats.',
        timeout: 10000,
        variant: 'default',
      });
      observerToastRef.current = id;
    }
  }, [game.isObserver]);

  const playerSeats = useMemo(() => {
    const players = [...game.players].sort((a, b) => a.seat - b.seat);
    const selfIndex = players.findIndex((player) => player.gamePlayerId === game.player?.gamePlayerId);
    const ordered = selfIndex <= 0 ? players : [...players.slice(selfIndex), ...players.slice(0, selfIndex)];
    return ordered.map((player, index) => ({ player, ...getPlayerPosition(tableSize, index / ordered.length, 14) }));
  }, [game.players, game.player?.gamePlayerId, tableSize]);

  const selectPlayingCards = useCallback(() => {
    if (!selectedPlayingCardIds.length) return;
    setIsPlaying(true);
    const commit = () => (setPlayedPlayingCardIds((prev) => [...prev, ...selectedPlayingCardIds]), setSelectedPlayingCardIds([]));
    if (document.startViewTransition) document.startViewTransition(() => flushSync(commit));
    else commit();
    onPlay(selectedPlayingCardIds, () => {
      setIsPlaying(false);
      if (document.startViewTransition) document.startViewTransition(() => flushSync(() => setPlayedPlayingCardIds([])));
      else setPlayedPlayingCardIds([]);
    });
  }, [selectedPlayingCardIds, setPlayedPlayingCardIds, setSelectedPlayingCardIds, onPlay]);

  return (
    <section className="flex min-h-svh flex-col items-center justify-center bg-radial from-neutral-800 to-neutral-950 p-12">
      <div className="flex w-full max-w-[calc(var(--container-7xl)+var(--spacing)*20)] flex-col items-center justify-center gap-20">
        <Surface
          ref={tableRef}
          className={cn(
            'elevation-3 relative h-180 w-full rounded-full',
            'from-surface-tertiary via-surface-secondary to-surface border-28 border-[oklch(0.3541_0.0182_47.82)] bg-radial',
            'before:absolute before:-inset-4 before:rounded-[inherit] before:border-4 before:border-white/5 before:content-[""]',
          )}
        >
          <Typography
            aria-hidden
            color="muted"
            weight="bold"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl opacity-10 select-none"
          >
            中国人 POKER
          </Typography>
          {(game.currentPlay?.cards.length ?? 0) > 0 && (
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div
                className={cn(
                  'relative flex gap-2',
                  playedPlayingCardIds.length > 0 &&
                    'translate-x-10 opacity-0 motion-safe:transition-[opacity,translate] starting:translate-0 starting:opacity-100',
                )}
              >
                {game.currentPlay?.cards.map((card) => (
                  <PlayingCard key={`${card.suit}-${card.rank}`} rank={card.rank} suit={card.suit} />
                ))}
                {game.currentPlay?.type && (
                  <Chip
                    key={currentPlayCards}
                    className={cn(
                      'elevation-3 absolute top-full left-1/2 mt-4 -translate-x-1/2 capitalize opacity-100',
                      'motion-safe:transition-[opacity,translate] starting:-translate-y-2 starting:opacity-0',
                    )}
                  >
                    {game.currentPlay.type.replace('_', ' ')}
                  </Chip>
                )}
              </div>
            </div>
          )}
          {playedPlayingCardIds.length > 0 && (
            <div className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-2">
              {sortGameCards(game.hand.filter((c) => playedPlayingCardIds.includes(c.id))).map((card) => (
                <PlayingCard key={card.id} rank={card.rank} suit={card.suit} style={{ viewTransitionName: `card-${card.id}` }} />
              ))}
            </div>
          )}
          {playerSeats.map(({ player, x, y }) => (
            <div key={player.gamePlayerId} style={{ left: `${x}px`, top: `${y}px` }} className="absolute -translate-x-1/2 -translate-y-1/2">
              <Tooltip delay={0}>
                <Tooltip.Trigger
                  aria-label={player.username}
                  className="focus-visible:ring-accent size-20 rounded-4xl focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Badge.Anchor>
                    <PlayerAvatar
                      size="lg"
                      id={player.discordId}
                      username={player.username}
                      avatarHash={player.avatarUrl}
                      className={cn(
                        'elevation-3 pointer-events-none size-20 rounded-4xl select-none',
                        player.isCurrentTurn && 'ring-accent ring-4',
                        player.isLockedOut && 'brightness-50 grayscale',
                      )}
                    />
                    <Badge size="lg" className={cn('elevation-3', player.isLockedOut && 'brightness-50 grayscale')}>
                      {player.handCount}
                    </Badge>
                  </Badge.Anchor>
                </Tooltip.Trigger>
                <Tooltip.Content showArrow className="elevation-3 px-4">
                  <Tooltip.Arrow />
                  <Typography type="body-sm">{player.username}</Typography>
                  <Typography type="body-xs" color="muted" className="-translate-y-1">
                    @{player.username}
                  </Typography>
                </Tooltip.Content>
              </Tooltip>
            </div>
          ))}
        </Surface>
        {!game.isObserver && (
          <div className="flex w-full flex-col items-center justify-center gap-12">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {playerHand.map((card) => (
                <Button
                  key={card.id}
                  aria-label={`${card.rank} of ${card.suit}`}
                  isDisabled={!game.player?.isCurrentTurn}
                  onClick={() =>
                    setSelectedPlayingCardIds((p) => (p.includes(card.id) ? p.filter((id) => id !== card.id) : [...p, card.id]))
                  }
                  className={cn(
                    'size-auto rounded-lg bg-transparent p-0 focus-visible:ring-6 disabled:opacity-100 motion-safe:transition-transform',
                    selectedPlayingCardIds.includes(card.id) && 'ring-accent -translate-y-4 ring-6',
                  )}
                >
                  <PlayingCard
                    rank={card.rank}
                    suit={card.suit}
                    style={{ viewTransitionName: `card-${card.id}` }}
                    className="pointer-events-none select-none"
                  />
                </Button>
              ))}
            </div>
            <div className="flex w-full gap-4">
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                className="elevation-3 h-12"
                isPending={isPassing}
                isDisabled={!game.player?.isCurrentTurn}
                onClick={() => (setIsPassing(true), onPass(() => setIsPassing(false)))}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? 'Passing...' : 'Pass'}
                  </>
                )}
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="elevation-3 h-12"
                isDisabled={!game.player?.isCurrentTurn || selectedPlayingCardIds.length === 0}
                isPending={isPlaying}
                onClick={selectPlayingCards}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? 'Playing...' : 'Play'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function getPlayerPosition({ width, height }: { width: number; height: number }, t: number, offset = 0) {
  width += offset * 2;
  height += offset * 2;
  const radius = height / 2;
  const straight = Math.max(width / 2 - radius, 0);
  const arc = Math.PI * radius;
  const perimeter = 4 * straight + 2 * arc;
  const center = width / 2;
  let distance = (((t % 1) + 1) % 1) * perimeter || 0;

  if (distance <= straight) return { x: center + distance - offset, y: height - offset };
  distance -= straight;
  if (distance <= arc) {
    const angle = (distance / arc) * Math.PI;
    return { x: center + straight + Math.sin(angle) * radius - offset, y: radius + Math.cos(angle) * radius - offset };
  }
  distance -= arc;
  if (distance <= 2 * straight) return { x: center + straight - distance - offset, y: -offset };
  distance -= 2 * straight;
  if (distance <= arc) {
    const angle = Math.PI + (distance / arc) * Math.PI;
    return { x: center - straight + Math.sin(angle) * radius - offset, y: radius + Math.cos(angle) * radius - offset };
  }
  distance -= arc;
  return { x: center - straight + distance - offset, y: height - offset };
}
