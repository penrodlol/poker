import db, { CARD_RANKS, CARD_SUITS, game, gameCard, gamePlayer, play, playCard, player, playerLeaderboard, type GamePlayer } from '#/db';
import { evaluateGameHand, gameBeats, sortGameCards } from '#/server/utils/game';
import { logError } from '#/server/utils/logger';
import { createServerFn } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { getServerByName } from 'partyserver';
import { z } from 'zod';
import type { GameChannelMessageDataGameOver } from './game-channel';

export type StartGameRequest = z.infer<typeof startGameRequestSchema>;
export type StartGameResponse = NonNullable<Awaited<ReturnType<typeof startGame>>>;
export type GetGameStateRequest = z.infer<typeof getGameStateRequestSchema>;
export type GetGameStateResponse = NonNullable<Awaited<ReturnType<typeof getGameState>>>;
export type PlayGameMoveRequest = z.infer<typeof playGameMoveRequestSchema>;
export type PlayGameMoveResponse = NonNullable<Awaited<ReturnType<typeof playGameMove>>>;
export type PassGameMoveRequest = z.infer<typeof passGameMoveRequestSchema>;
export type PassGameMoveResponse = NonNullable<Awaited<ReturnType<typeof passGameMove>>>;

export const START_GAME_ERROR = 'Start Game Failed';
export const GET_GAME_STATE_ERROR = 'Get Game State Failed';
export const PLAY_GAME_MOVE_GAME_NOT_FOUND_ERROR = 'Play Game Move Game Not Found';
export const PLAY_GAME_MOVE_PLAYER_NOT_FOUND_ERROR = 'Play Game Move Player Not Found';
export const PLAY_GAME_MOVE_PLAYER_NOT_IN_TURN_ERROR = 'Play Game Move Player Not In Turn';
export const PLAY_GAME_MOVE_CARDS_NOT_IN_HAND_ERROR = 'Play Game Move Cards Not In Hand';
export const PLAY_GAME_MOVE_INVALID_HAND_ERROR = 'Play Game Move Invalid Hand';
export const PLAY_GAME_MOVE_FIRST_PLAY_MUST_CONTAIN_THREE_OF_DIAMONDS_ERROR = 'Play Game Move First Play Must Contain Three of Diamonds';
export const PLAY_GAME_MOVE_DOES_NOT_BEAT_CURRENT_PLAY_ERROR = 'Play Game Move Does Not Beat Current Play';
export const PLAY_GAME_MOVE_ERROR = 'Play Game Move Failed';
export const PASS_GAME_MOVE_GAME_NOT_FOUND_ERROR = 'Pass Game Move Game Not Found';
export const PASS_GAME_MOVE_CANNOT_PASS_ON_FREE_PLAY_ERROR = 'Pass Game Move Cannot Pass On Free Play';
export const PASS_GAME_MOVE_PLAYER_NOT_FOUND_ERROR = 'Pass Game Move Player Not Found';
export const PASS_GAME_MOVE_PLAYER_NOT_IN_TURN_ERROR = 'Pass Game Move Player Not In Turn';
export const PASS_GAME_MOVE_ERROR = 'Pass Game Move Failed';

export const startGameRequestSchema = z.object({
  guildId: z.string().min(1),
  channelId: z.string().min(1),
  players: z
    .array(
      z.object({
        discordId: z.string().min(1),
        username: z.string().min(1),
        displayName: z.string().nullish(),
        avatarUrl: z.string().nullish(),
      }),
    )
    .min(1),
});
export const getGameStateRequestSchema = z.object({ channelId: z.string().min(1), discordId: z.string().min(1) });
export const playGameMoveRequestSchema = z.object({
  channelId: z.string().min(1),
  discordId: z.string().min(1),
  cardIds: z.array(z.string().min(1)).min(1),
});
export const passGameMoveRequestSchema = z.object({ channelId: z.string().min(1), discordId: z.string().min(1) });

export const gameStateQueryKey = (data: GetGameStateRequest) => ['gameState', data.channelId, data.discordId] as const;
export const getGameStateQueryOptions = (data: GetGameStateRequest, enabled = true) => ({
  queryKey: gameStateQueryKey(data),
  queryFn: () => getGameState({ data }),
  staleTime: 0,
  gcTime: 0,
  enabled,
});

export const startGame = createServerFn({ method: 'POST' })
  .validator(startGameRequestSchema)
  .handler(async ({ data }) => {
    try {
      await db.delete(game).where(eq(game.channelId, data.channelId));
      const currentGame = await db.insert(game).values({ guildId: data.guildId, channelId: data.channelId }).returning().get();

      const players = await db
        .insert(player)
        .values(data.players)
        .onConflictDoUpdate({
          target: player.discordId,
          set: { username: sql`excluded.username`, displayName: sql`excluded.display_name`, avatarUrl: sql`excluded.avatar_url` },
        })
        .returning()
        .then((players) =>
          players
            .map((player) => ({ player, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ player }, seat) => ({ gameId: currentGame.id, playerId: player.id, seat })),
        );
      const gamePlayers = await db.insert(gamePlayer).values(players).returning();

      const gameDeck = CARD_RANKS.flatMap((rank) => CARD_SUITS.map((suit) => ({ rank, suit })));
      const gameDeckShuffled = gameDeck
        .map((card) => ({ card, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ card }) => card);
      const gameDeckPlayerCardsAmount = gamePlayers.length * Math.floor(gameDeck.length / gamePlayers.length);
      const gameDeckThreeOfDiamondsIndex = gameDeckShuffled.findIndex((card) => card.rank === '3' && card.suit === 'diamonds');
      const gameDeckThreeOfDiamondsIsDiscarded = gameDeckThreeOfDiamondsIndex >= gameDeckPlayerCardsAmount;
      if (gameDeckThreeOfDiamondsIsDiscarded)
        [gameDeckShuffled[0], gameDeckShuffled[gameDeckThreeOfDiamondsIndex]] = [
          gameDeckShuffled[gameDeckThreeOfDiamondsIndex],
          gameDeckShuffled[0],
        ];

      const gameCards = gameDeckShuffled.slice(0, gameDeckPlayerCardsAmount).map((card, index) => ({
        gameId: currentGame.id,
        gamePlayerId: gamePlayers[index % gamePlayers.length].id,
        rank: card.rank,
        suit: card.suit,
      }));
      for (let index = 0; index < gameCards.length; index += 20) await db.insert(gameCard).values(gameCards.slice(index, index + 20));

      const gameCurrentRound = 1;
      const gameCurrentTurnPlayerId =
        gamePlayers[gameDeckThreeOfDiamondsIsDiscarded ? 0 : gameDeckThreeOfDiamondsIndex % gamePlayers.length].id;

      const startedGame = await db
        .update(game)
        .set({ currentRound: gameCurrentRound, currentTurnPlayerId: gameCurrentTurnPlayerId })
        .where(eq(game.id, currentGame.id))
        .returning()
        .get();

      await (await getServerByName(env.GameChannelDurableObject, data.channelId)).notify();
      return startedGame;
    } catch (error) {
      logError(START_GAME_ERROR, { error });
      throw new Error(START_GAME_ERROR);
    }
  });

export const getGameState = createServerFn({ method: 'POST' })
  .validator(getGameStateRequestSchema)
  .handler(async ({ data }) => {
    try {
      const currentGame = await db.query.game.findFirst({
        where: eq(game.channelId, data.channelId),
        with: {
          players: {
            columns: { id: true, seat: true, isLockedOut: true, placement: true },
            with: { player: { columns: { discordId: true, username: true, displayName: true, avatarUrl: true } } },
            orderBy: (players, { asc }) => asc(players.seat),
          },
          cards: { columns: { id: true, rank: true, suit: true, gamePlayerId: true } },
          currentPlay: {
            columns: { type: true, round: true },
            with: { cards: { with: { gameCard: { columns: { rank: true, suit: true } } } } },
          },
        },
      });
      if (!currentGame) return { status: 'not-found' as const, data: null };

      const gamePlayerSelf = currentGame.players.find((p) => p.player.discordId === data.discordId);
      const gamePlayers = currentGame.players.map((p) => ({
        gamePlayerId: p.id,
        seat: p.seat,
        discordId: p.player.discordId,
        username: p.player.username,
        displayName: p.player.displayName,
        avatarUrl: p.player.avatarUrl,
        isLockedOut: p.isLockedOut,
        placement: p.placement,
        handCount: currentGame.cards.filter((c) => c.gamePlayerId === p.id).length,
        isCurrentTurn: p.id === currentGame.currentTurnPlayerId,
      }));
      const gamePlayer = gamePlayers.find((p) => p.discordId === data.discordId) ?? null;
      const gamePlayerHand = gamePlayerSelf
        ? sortGameCards(
            currentGame.cards.filter((c) => c.gamePlayerId === gamePlayerSelf.id).map((c) => ({ id: c.id, rank: c.rank, suit: c.suit })),
          )
        : [];

      const gameCurrentPlayCards = sortGameCards(
        currentGame.currentPlay?.cards.map((c) => ({ rank: c.gameCard.rank, suit: c.gameCard.suit })) ?? [],
      );
      const gameCurrentPlay = currentGame.currentPlay ? { type: currentGame.currentPlay.type, cards: gameCurrentPlayCards } : null;
      const gameIsFreePlay = !currentGame.currentPlay || currentGame.currentPlay.round !== currentGame.currentRound;

      return {
        status: 'found' as const,
        data: {
          game: currentGame,
          players: gamePlayers,
          player: gamePlayer,
          currentPlay: gameCurrentPlay,
          isFreePlay: gameIsFreePlay,
          isObserver: !gamePlayerSelf,
          hand: gamePlayerHand,
        },
      };
    } catch (error) {
      logError(GET_GAME_STATE_ERROR, { error });
      throw new Error(GET_GAME_STATE_ERROR, { cause: error });
    }
  });

export const playGameMove = createServerFn({ method: 'POST' })
  .validator(playGameMoveRequestSchema)
  .handler(async ({ data }) => {
    try {
      const currentGame = await db.query.game.findFirst({
        where: eq(game.channelId, data.channelId),
        with: {
          players: {
            columns: { id: true, seat: true, isLockedOut: true, placement: true },
            with: {
              player: { columns: { id: true, discordId: true, username: true, displayName: true } },
              cards: { columns: { id: true, rank: true, suit: true } },
            },
          },
          plays: { columns: { id: true }, limit: 1 },
          currentPlay: {
            columns: { id: true, round: true },
            with: { cards: { with: { gameCard: { columns: { rank: true, suit: true } } } } },
          },
        },
      });
      if (!currentGame) throw new Error(PLAY_GAME_MOVE_GAME_NOT_FOUND_ERROR);

      const gamePlayerSelf = currentGame.players.find((p) => p.player.discordId === data.discordId);
      if (!gamePlayerSelf) throw new Error(PLAY_GAME_MOVE_PLAYER_NOT_FOUND_ERROR);
      if (currentGame.currentTurnPlayerId !== gamePlayerSelf.id) throw new Error(PLAY_GAME_MOVE_PLAYER_NOT_IN_TURN_ERROR);

      const gameCards = gamePlayerSelf.cards.filter((c) => data.cardIds.includes(c.id));
      if (gameCards.length !== data.cardIds.length) throw new Error(PLAY_GAME_MOVE_CARDS_NOT_IN_HAND_ERROR);

      const gameCardsEvaluated = evaluateGameHand(gameCards);
      if (!gameCardsEvaluated) throw new Error(PLAY_GAME_MOVE_INVALID_HAND_ERROR);

      if (currentGame.plays.length === 0 && !gameCards.some((c) => c.rank === '3' && c.suit === 'diamonds'))
        throw new Error(PLAY_GAME_MOVE_FIRST_PLAY_MUST_CONTAIN_THREE_OF_DIAMONDS_ERROR);

      const gameIsFreePlay = !currentGame.currentPlay || currentGame.currentPlay.round !== currentGame.currentRound;
      if (!gameIsFreePlay && currentGame.currentPlay) {
        const gameCurrentEvaluated = evaluateGameHand(currentGame.currentPlay.cards.map((c) => c.gameCard));
        if (gameCurrentEvaluated && !gameBeats(gameCardsEvaluated, gameCurrentEvaluated))
          throw new Error(PLAY_GAME_MOVE_DOES_NOT_BEAT_CURRENT_PLAY_ERROR);
      }

      const gameFinished = gamePlayerSelf.cards.length === gameCards.length;

      const gamePlayId = crypto.randomUUID();
      const gameWrites: [BatchItem<'sqlite'>, ...Array<BatchItem<'sqlite'>>] = [
        db.insert(play).values({
          id: gamePlayId,
          gameId: currentGame.id,
          gamePlayerId: gamePlayerSelf.id,
          round: currentGame.currentRound,
          type: gameCardsEvaluated.type,
          beatsPlayId: gameIsFreePlay ? null : currentGame.currentPlayId,
        }),
        db.insert(playCard).values(gameCards.map((c) => ({ playId: gamePlayId, gameCardId: c.id }))),
        db.update(gameCard).set({ gamePlayerId: null }).where(inArray(gameCard.id, data.cardIds)),
        db
          .update(game)
          .set({
            currentPlayId: gamePlayId,
            currentTurnPlayerId: gameFinished ? null : getGameNextEligiblePlayerId(gamePlayerSelf.id, currentGame.players),
          })
          .where(eq(game.id, currentGame.id)),
      ];

      if (gameFinished)
        for (const gamePlayer of currentGame.players) {
          const gamePlayerWon = gamePlayer.id === gamePlayerSelf.id;
          const gamesWon = gamePlayerWon ? 1 : 0;
          gameWrites.push(
            db
              .insert(playerLeaderboard)
              .values({ playerId: gamePlayer.player.id, guildId: currentGame.guildId, gamesWon })
              .onConflictDoUpdate({
                target: [playerLeaderboard.playerId, playerLeaderboard.guildId],
                set: { gamesWon: sql`${playerLeaderboard.gamesWon} + ${gamesWon}` },
              }),
          );
        }

      await db.batch(gameWrites);

      if (gameFinished) {
        const realtimeData: GameChannelMessageDataGameOver = {
          discordId: data.discordId,
          username: gamePlayerSelf.player.username,
          displayName: gamePlayerSelf.player.displayName,
        };
        await db.delete(game).where(eq(game.id, currentGame.id));
        await (await getServerByName(env.GameChannelDurableObject, data.channelId)).notify({ type: 'gameover', data: realtimeData });
        return { gameId: currentGame.id, type: gameCardsEvaluated.type, finished: true };
      }

      await (await getServerByName(env.GameChannelDurableObject, data.channelId)).notify();

      return { gameId: currentGame.id, type: gameCardsEvaluated.type, finished: false };
    } catch (error) {
      logError(PLAY_GAME_MOVE_ERROR, { error });
      throw new Error(PLAY_GAME_MOVE_ERROR, { cause: error });
    }
  });

export const passGameMove = createServerFn({ method: 'POST' })
  .validator(passGameMoveRequestSchema)
  .handler(async ({ data }) => {
    try {
      const discordGame = await db.query.game.findFirst({
        where: eq(game.channelId, data.channelId),
        with: {
          players: {
            columns: { id: true, seat: true, isLockedOut: true, placement: true },
            with: { player: { columns: { discordId: true } } },
          },
          currentPlay: { columns: { round: true } },
        },
      });
      if (!discordGame) throw new Error(PASS_GAME_MOVE_GAME_NOT_FOUND_ERROR);
      if (!discordGame.currentPlayId || discordGame.currentPlay?.round !== discordGame.currentRound)
        throw new Error(PASS_GAME_MOVE_CANNOT_PASS_ON_FREE_PLAY_ERROR);

      const gamePlayerSelf = discordGame.players.find((p) => p.player.discordId === data.discordId);
      if (!gamePlayerSelf) throw new Error(PASS_GAME_MOVE_PLAYER_NOT_FOUND_ERROR);
      if (discordGame.currentTurnPlayerId !== gamePlayerSelf.id) throw new Error(PASS_GAME_MOVE_PLAYER_NOT_IN_TURN_ERROR);

      const gamePlayers = discordGame.players.map((p) => ({ ...p, isLockedOut: p.id === gamePlayerSelf.id ? true : p.isLockedOut }));
      const gamePlayersActive = gamePlayers.filter((p) => p.placement === null && !p.isLockedOut);

      const gameWrites: [BatchItem<'sqlite'>, ...Array<BatchItem<'sqlite'>>] = [
        db.insert(play).values({
          gameId: discordGame.id,
          gamePlayerId: gamePlayerSelf.id,
          round: discordGame.currentRound,
          isPass: true,
          beatsPlayId: discordGame.currentPlayId,
        }),
        db.update(gamePlayer).set({ isLockedOut: true }).where(eq(gamePlayer.id, gamePlayerSelf.id)),
      ];

      if (gamePlayersActive.length <= 1) {
        gameWrites.push(
          db
            .update(gamePlayer)
            .set({ isLockedOut: false })
            .where(and(eq(gamePlayer.gameId, discordGame.id), isNull(gamePlayer.placement))),
        );
        gameWrites.push(
          db
            .update(game)
            .set({ currentRound: discordGame.currentRound + 1, currentTurnPlayerId: gamePlayersActive[0]?.id ?? null })
            .where(eq(game.id, discordGame.id)),
        );
      } else
        gameWrites.push(
          db
            .update(game)
            .set({ currentTurnPlayerId: getGameNextEligiblePlayerId(gamePlayerSelf.id, gamePlayers) })
            .where(eq(game.id, discordGame.id)),
        );

      await db.batch(gameWrites);
      await (await getServerByName(env.GameChannelDurableObject, data.channelId)).notify();

      return { gameId: discordGame.id, roundEnded: gamePlayersActive.length <= 1 };
    } catch (error) {
      logError(PASS_GAME_MOVE_ERROR, { error });
      throw new Error(PASS_GAME_MOVE_ERROR, { cause: error });
    }
  });

function getGameNextEligiblePlayerId(id: string, players: Array<Pick<GamePlayer, 'id' | 'seat' | 'isLockedOut' | 'placement'>>) {
  const playersOrdered = [...players].sort((a, b) => a.seat - b.seat);
  const playerFromIndex = playersOrdered.findIndex((p) => p.id === id);
  for (let offset = 1; offset <= playersOrdered.length; offset++) {
    const candidate = playersOrdered[(playerFromIndex + offset) % playersOrdered.length];
    if (candidate.placement === null && !candidate.isLockedOut) return candidate.id;
  }
  return null;
}
