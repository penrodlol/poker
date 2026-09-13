import { getLeaderboardQueryOptions } from '#/server/fetch/src/leaderboard';
import { useQuery } from '@tanstack/react-query';

export type LeaderboardProps = { guildId: string };

export default function Leaderboard({ guildId }: LeaderboardProps) {
  const { data } = useQuery(getLeaderboardQueryOptions({ guildId }));

  return <></>;
}
