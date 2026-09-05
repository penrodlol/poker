import db, { CARD_RANKS, CARD_SUITS, game, gameCard, gamePlayer, player } from '#/db';
import { logError } from '#/server/utils/logger';
import { createServerFn } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

export type GetDiscordAccessTokenRequest = z.infer<typeof getDiscordAccessTokenRequestSchema>;
export type GetDiscordAccessTokenResponse = NonNullable<Awaited<ReturnType<typeof getDiscordAccessToken>>>;
export type StartDiscordGameRequest = z.infer<typeof startDiscordGameRequestSchema>;
export type StartDiscordGameResponse = NonNullable<Awaited<ReturnType<typeof startDiscordGame>>>;
export type GetDiscordChannelGameRequest = z.infer<typeof getDiscordChannelGameRequestSchema>;
export type GetDiscordChannelGameResponse = NonNullable<Awaited<ReturnType<typeof getDiscordChannelGame>>>;

export const GET_DISCORD_ACCESS_TOKEN_FETCH_TOKEN_ERROR = 'Discord Fetch Token Failed';
export const GET_DISCORD_ACCESS_TOKEN_ERROR = 'Discord Authentication Failed';
export const START_DISCORD_GAME_ERROR = 'Discord Start Game Failed';
export const GET_DISCORD_CHANNEL_GAME_ERROR = 'Discord Get Channel Game Failed';

export const getDiscordAccessTokenRequestSchema = z.object({ code: z.string().min(1) });
export const startDiscordGameRequestSchema = z.object({
  guildId: z.string().min(1),
  channelId: z.string().min(1),
  players: z.array(z.object({ discordId: z.string().min(1), username: z.string().min(1), avatarUrl: z.string().nullish() })).min(1),
});
export const getDiscordChannelGameRequestSchema = z.object({ channelId: z.string().min(1) });

export const getDiscordAccessToken = createServerFn({ method: 'POST' })
  .validator(getDiscordAccessTokenRequestSchema)
  .handler(async ({ data }) => {
    try {
      const discordAccessTokenResponse = await fetch(env.DISCORD_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.VITE_DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: data.code,
        }),
      });
      if (!discordAccessTokenResponse.ok)
        throw new Error(`${GET_DISCORD_ACCESS_TOKEN_FETCH_TOKEN_ERROR}: ${discordAccessTokenResponse.status}`);
      const { access_token } = z.object({ access_token: z.string() }).parse(await discordAccessTokenResponse.json());

      return { access_token };
    } catch (error) {
      logError(GET_DISCORD_ACCESS_TOKEN_ERROR, { error });
      throw new Error(GET_DISCORD_ACCESS_TOKEN_ERROR);
    }
  });

export const startDiscordGame = createServerFn({ method: 'POST' })
  .validator(startDiscordGameRequestSchema)
  .handler(async ({ data }) => {
    try {
      await db.delete(game).where(eq(game.channelId, data.channelId));
      const discordGame = await db.insert(game).values({ guildId: data.guildId, channelId: data.channelId }).returning().get();

      const players = await db
        .insert(player)
        .values(data.players)
        .onConflictDoUpdate({ target: player.discordId, set: { username: sql`excluded.username`, avatarUrl: sql`excluded.avatar_url` } })
        .returning()
        .then((players) =>
          players
            .map((player) => ({ player, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ player }, seat) => ({ gameId: discordGame.id, playerId: player.id, seat })),
        );
      const gamePlayers = await db.insert(gamePlayer).values(players).returning();

      const gameDeck = CARD_RANKS.flatMap((rank) => CARD_SUITS.map((suit) => ({ rank, suit })));
      const gameDeckShuffled = gameDeck
        .map((card) => ({ card, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ card }) => card);
      const gameDeckPlayerCardsAmount = gamePlayers.length * Math.floor(gameDeck.length / gamePlayers.length);
      const gameDeckThreeOfDiamondsIndex = gameDeckShuffled.findIndex((card) => card.rank === '3' && card.suit === 'diamonds');
      if (gameDeckThreeOfDiamondsIndex >= gameDeckPlayerCardsAmount)
        [gameDeckShuffled[0], gameDeckShuffled[gameDeckThreeOfDiamondsIndex]] = [
          gameDeckShuffled[gameDeckThreeOfDiamondsIndex],
          gameDeckShuffled[0],
        ];

      const gameCards = gameDeckShuffled.slice(0, gameDeckPlayerCardsAmount).map((card, index) => ({
        gameId: discordGame.id,
        gamePlayerId: gamePlayers[index % gamePlayers.length].id,
        rank: card.rank,
        suit: card.suit,
      }));
      for (let index = 0; index < gameCards.length; index += 20) await db.insert(gameCard).values(gameCards.slice(index, index + 20));

      return discordGame;
    } catch (error) {
      logError(START_DISCORD_GAME_ERROR, { error });
      throw new Error(START_DISCORD_GAME_ERROR);
    }
  });

export const getDiscordChannelGame = createServerFn({ method: 'POST' })
  .validator(getDiscordChannelGameRequestSchema)
  .handler(async ({ data }) => {
    try {
      const discordGame = await db.select().from(game).where(eq(game.channelId, data.channelId)).get();
      if (!discordGame) return null;

      const players = await db
        .select({ seat: gamePlayer.seat, discordId: player.discordId, username: player.username, avatarUrl: player.avatarUrl })
        .from(gamePlayer)
        .innerJoin(player, eq(gamePlayer.playerId, player.id))
        .where(eq(gamePlayer.gameId, discordGame.id))
        .orderBy(gamePlayer.seat);

      return { game: discordGame, players };
    } catch (error) {
      logError(GET_DISCORD_CHANNEL_GAME_ERROR, { error });
      throw new Error(GET_DISCORD_CHANNEL_GAME_ERROR);
    }
  });
