import db, { playerLeaderboard } from '#/db';
import { logError } from '#/server/utils/logger';
import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

export type LeaderboardRequest = z.infer<typeof getLeaderboardRequestSchema>;
export type LeaderboardResponse = NonNullable<Awaited<ReturnType<typeof getLeaderboard>>>;

export const GET_LEADERBOARD_ERROR = 'Get Leaderboard Failed';

export const getLeaderboardRequestSchema = z.object({ guildId: z.string().min(1) });

export const getLeaderboardQueryKey = (guildId: string) => ['leaderboard', guildId];
export const getLeaderboardQueryOptions = (data: LeaderboardRequest) => ({
  queryKey: getLeaderboardQueryKey(data.guildId),
  queryFn: () => getLeaderboard({ data }),
  staleTime: 0,
  gcTime: 0,
});

export const getLeaderboard = createServerFn({ method: 'POST' })
  .validator(getLeaderboardRequestSchema)
  .handler(async ({ data }) => {
    try {
      return db.query.playerLeaderboard.findMany({
        where: eq(playerLeaderboard.guildId, data.guildId),
        with: { player: true },
        orderBy: desc(playerLeaderboard.gamesWon),
      });
    } catch (error) {
      logError(GET_LEADERBOARD_ERROR, error);
      throw new Error(GET_LEADERBOARD_ERROR);
    }
  });
