import PlayerAvatar from '#/components/player-avatar';
import PlayingCard from '#/components/playing-card';
import { Button, Chip, cn, Spinner, Surface, Typography } from '@heroui/react';
import { UsersIcon } from '@phosphor-icons/react';
import { useDiscord } from './-_discord';

export type GameStartProps = { isPending: boolean; onStartGame: () => void };

export default function GameStart({ isPending, onStartGame }: GameStartProps) {
  const { user, participants } = useDiscord();

  return (
    <section
      className={cn(
        'flex min-h-svh items-center justify-center p-4',
        'scale-100 opacity-100 motion-safe:starting:scale-[0.98] motion-safe:starting:opacity-0',
        'motion-safe:transition-[opacity,scale] motion-safe:will-change-transform',
      )}
    >
      <div className="flex w-full max-w-2xl flex-col items-center gap-12">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center gap-8">
            <PlayingCard rank="5" suit="spades" />
            <PlayingCard rank="5" suit="hearts" />
            <PlayingCard rank="5" suit="diamonds" />
            <PlayingCard rank="5" suit="clubs" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <Typography type="h1" weight="bold" className="text-5xl">
              中国人 POKER
            </Typography>
            <Typography color="muted">Play your cards, outsmart your opponents, and take the win</Typography>
          </div>
        </div>
        <Surface className="elevation-3 flex w-full flex-col rounded-2xl">
          <div className="flex items-center justify-between gap-4 border-b p-4">
            <Typography weight="bold">Players</Typography>
            <Chip variant="soft" color="accent" className="elevation-3">
              <UsersIcon />
              <Chip.Label>{participants.length} in lobby</Chip.Label>
            </Chip>
          </div>
          <div>
            {participants.map((participant) => (
              <Surface key={participant.id} variant="transparent" className="flex flex-wrap items-center gap-4 px-4 py-2 not-last:border-b">
                <PlayerAvatar id={participant.id} avatarHash={participant.avatar} username={participant.username} />
                <div className="flex flex-col">
                  <Typography type="body-sm" truncate>
                    {participant.global_name ?? participant.username}
                  </Typography>
                  <Typography type="body-xs" color="muted" truncate className="-translate-y-1">
                    @{participant.username}
                  </Typography>
                </div>
              </Surface>
            ))}
          </div>
        </Surface>
        {!!user && participants[0]?.id === user.id ? (
          <Button size="lg" variant="primary" className="elevation-3 w-full lg:w-1/2" isPending={isPending} onClick={onStartGame}>
            {({ isPending }) => (
              <>
                {isPending ? <Spinner color="current" size="sm" /> : null}
                {isPending ? 'Starting Game...' : 'Start Game'}
              </>
            )}
          </Button>
        ) : (
          <Typography color="muted" className="text-center motion-safe:animate-pulse">
            Waiting for {participants[0]?.global_name ?? participants[0]?.username ?? 'the host'} to start the game...
          </Typography>
        )}
      </div>
    </section>
  );
}
