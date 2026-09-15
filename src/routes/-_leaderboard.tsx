import PlayerAvatar from '#/components/player-avatar';
import { getLeaderboardQueryOptions } from '#/server/fetch/src/leaderboard';
import { EmptyState, Spinner, Table, Typography } from '@heroui/react';
import { EmptyIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';

export type LeaderboardProps = { guildId: string };

export default function Leaderboard({ guildId }: LeaderboardProps) {
  const { data, isLoading } = useQuery(getLeaderboardQueryOptions({ guildId }));

  return (
    <Table className="mt-8 min-h-80">
      <Table.ScrollContainer>
        <Table.Content aria-label="Leaderboard">
          <Table.Header>
            <Table.Column isRowHeader>Player</Table.Column>
            <Table.Column>Wins</Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <EmptyState className="flex min-h-[calc((var(--spacing)*80)-(var(--spacing)*8))] w-full flex-col items-center justify-center gap-2">
                {isLoading ? <Spinner /> : <EmptyIcon className="text-muted size-8" />}
                <Typography type="body-sm" color="muted">
                  {isLoading ? 'Loading...' : 'No players found'}
                </Typography>
              </EmptyState>
            )}
          >
            {data?.map((player) => (
              <Table.Row key={player.id}>
                <Table.Cell className="flex items-center gap-4">
                  <PlayerAvatar id={player.player.discordId} avatarHash={player.player.avatarUrl} username={player.player.username} />
                  <div className="flex flex-col">
                    <Typography type="body-sm">{player.player.displayName}</Typography>
                    <Typography type="body-xs" color="muted" truncate className="-translate-y-1">
                      @{player.player.username}
                    </Typography>
                  </div>
                </Table.Cell>
                <Table.Cell>{player.gamesWon}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
