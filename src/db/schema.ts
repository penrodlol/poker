import { relations, sql } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { index, integer, SQLiteColumnBuilder, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export type Player = typeof player.$inferSelect;
export type Players = Array<Player>;
export type PlayerLeaderboard = typeof playerLeaderboard.$inferSelect;
export type PlayerLeaderboards = Array<PlayerLeaderboard>;
export type Achievement = typeof achievement.$inferSelect;
export type Achievements = Array<Achievement>;
export type PlayerAchievement = typeof playerAchievement.$inferSelect;
export type PlayerAchievements = Array<PlayerAchievement>;
export type Game = typeof game.$inferSelect;
export type Games = Array<Game>;
export type GamePlayer = typeof gamePlayer.$inferSelect;
export type GamePlayers = Array<GamePlayer>;
export type GameCard = typeof gameCard.$inferSelect;
export type GameCards = Array<GameCard>;
export type Play = typeof play.$inferSelect;
export type Plays = Array<Play>;
export type PlayCard = typeof playCard.$inferSelect;
export type PlayCards = Array<PlayCard>;
export type CardSuite = (typeof gameCard.$inferSelect)['suit'];
export type CardRank = (typeof gameCard.$inferSelect)['rank'];
export type PlayType = (typeof play.$inferSelect)['type'];

export const CARD_RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'] as const;
export const CARD_SUITS = ['diamonds', 'clubs', 'hearts', 'spades'] as const;

const primaryKey = text()
  .primaryKey()
  .notNull()
  .$defaultFn(() => crypto.randomUUID());
const foreignKey = (columnName: string, ...props: Parameters<SQLiteColumnBuilder['references']>) => text(columnName).references(...props);
const timestamp = (columnName: string) =>
  integer(columnName)
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);

// ==================================================================
//                              TABLES
// ==================================================================

export const player = sqliteTable('player', {
  id: primaryKey,
  discordId: text('discord_id').notNull().unique(),
  username: text().notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at'),
});

export const playerLeaderboard = sqliteTable(
  'player_leaderboard',
  {
    id: primaryKey,
    guildId: text('guild_id').notNull(),
    gamesWon: integer('games_won').notNull().default(0),
    gamesLost: integer('games_lost').notNull().default(0),
    createdAt: timestamp('created_at'),
    playerId: foreignKey('player_id', () => player.id, { onDelete: 'cascade' }).notNull(),
  },
  (table) => [uniqueIndex('player_leaderboard_player_id_guild_id_idx').on(table.playerId, table.guildId)],
);

export const achievement = sqliteTable('achievement', {
  id: primaryKey,
  name: text().notNull().unique(),
  description: text().notNull(),
  logo: text('logo').notNull(),
  createdAt: timestamp('created_at'),
});

export const playerAchievement = sqliteTable(
  'player_achievement',
  {
    id: primaryKey,
    guildId: text('guild_id').notNull(),
    createdAt: timestamp('created_at'),
    playerId: foreignKey('player_id', () => player.id, { onDelete: 'cascade' }).notNull(),
    achievementId: foreignKey('achievement_id', () => achievement.id, { onDelete: 'cascade' }).notNull(),
  },
  (table) => [
    uniqueIndex('player_achievement_player_id_guild_id_achievement_id_idx').on(table.playerId, table.guildId, table.achievementId),
  ],
);

export const game = sqliteTable(
  'game',
  {
    id: primaryKey,
    guildId: text('guild_id').notNull(),
    channelId: text('channel_id').notNull(),
    currentRound: integer('current_round').notNull().default(0),
    createdAt: timestamp('created_at'),
    currentTurnPlayerId: foreignKey('current_turn_player_id', (): AnySQLiteColumn => gamePlayer.id, { onDelete: 'set null' }),
    currentPlayId: foreignKey('current_play_id', (): AnySQLiteColumn => play.id, { onDelete: 'set null' }),
  },
  (table) => [uniqueIndex('game_channel_id_idx').on(table.channelId)],
);

export const gamePlayer = sqliteTable(
  'game_player',
  {
    id: primaryKey,
    seat: integer().notNull(),
    isLockedOut: integer('is_locked_out', { mode: 'boolean' }).notNull().default(false),
    placement: integer(),
    createdAt: timestamp('created_at'),
    gameId: foreignKey('game_id', (): AnySQLiteColumn => game.id, { onDelete: 'cascade' }).notNull(),
    playerId: foreignKey('player_id', () => player.id).notNull(),
  },
  (table) => [
    uniqueIndex('game_player_game_id_player_id_idx').on(table.gameId, table.playerId),
    uniqueIndex('game_player_game_id_seat_idx').on(table.gameId, table.seat),
  ],
);

export const gameCard = sqliteTable(
  'game_card',
  {
    id: primaryKey,
    rank: text({ enum: CARD_RANKS }).notNull(),
    suit: text({ enum: CARD_SUITS }).notNull(),
    createdAt: timestamp('created_at'),
    gameId: foreignKey('game_id', () => game.id, { onDelete: 'cascade' }).notNull(),
    gamePlayerId: foreignKey('game_player_id', () => gamePlayer.id, { onDelete: 'set null' }),
  },
  (table) => [index('game_card_game_id_game_player_id_idx').on(table.gameId, table.gamePlayerId)],
);

export const play = sqliteTable(
  'play',
  {
    id: primaryKey,
    round: integer().notNull(),
    type: text({ enum: ['single', 'pair', 'straight', 'flush', 'full_house', 'straight_flush'] }),
    isPass: integer('is_pass', { mode: 'boolean' }).notNull().default(false),
    createdAt: timestamp('created_at'),
    gameId: foreignKey('game_id', (): AnySQLiteColumn => game.id, { onDelete: 'cascade' }).notNull(),
    gamePlayerId: foreignKey('game_player_id', (): AnySQLiteColumn => gamePlayer.id, { onDelete: 'cascade' }).notNull(),
    beatsPlayId: foreignKey('beats_play_id', (): AnySQLiteColumn => play.id, { onDelete: 'set null' }),
  },
  (table) => [index('play_game_id_round_created_at_idx').on(table.gameId, table.round, table.createdAt)],
);

export const playCard = sqliteTable('play_card', {
  id: primaryKey,
  playId: foreignKey('play_id', (): AnySQLiteColumn => play.id, { onDelete: 'cascade' }).notNull(),
  gameCardId: foreignKey('game_card_id', (): AnySQLiteColumn => gameCard.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
});

// ==================================================================
//                            RELATIONS
// ==================================================================

export const playerRelations = relations(player, ({ many }) => ({
  gamePlayers: many(gamePlayer),
  leaderboards: many(playerLeaderboard),
  achievements: many(playerAchievement),
}));

export const playerLeaderboardRelations = relations(playerLeaderboard, ({ one }) => ({
  player: one(player, { fields: [playerLeaderboard.playerId], references: [player.id] }),
}));

export const achievementRelations = relations(achievement, ({ many }) => ({
  playerAchievements: many(playerAchievement),
}));

export const playerAchievementRelations = relations(playerAchievement, ({ one }) => ({
  player: one(player, { fields: [playerAchievement.playerId], references: [player.id] }),
  achievement: one(achievement, { fields: [playerAchievement.achievementId], references: [achievement.id] }),
}));

export const gameRelations = relations(game, ({ one, many }) => ({
  players: many(gamePlayer, { relationName: 'gamePlayers' }),
  cards: many(gameCard),
  plays: many(play, { relationName: 'gamePlays' }),
  currentTurnPlayer: one(gamePlayer, {
    fields: [game.currentTurnPlayerId],
    references: [gamePlayer.id],
    relationName: 'currentTurnPlayer',
  }),
  currentPlay: one(play, { fields: [game.currentPlayId], references: [play.id], relationName: 'currentPlay' }),
}));

export const gamePlayerRelations = relations(gamePlayer, ({ one, many }) => ({
  game: one(game, { fields: [gamePlayer.gameId], references: [game.id], relationName: 'gamePlayers' }),
  player: one(player, { fields: [gamePlayer.playerId], references: [player.id] }),
  cards: many(gameCard),
  plays: many(play),
}));

export const gameCardRelations = relations(gameCard, ({ one, many }) => ({
  game: one(game, { fields: [gameCard.gameId], references: [game.id] }),
  holder: one(gamePlayer, { fields: [gameCard.gamePlayerId], references: [gamePlayer.id] }),
  playCards: many(playCard),
}));

export const playRelations = relations(play, ({ one, many }) => ({
  game: one(game, { fields: [play.gameId], references: [game.id], relationName: 'gamePlays' }),
  gamePlayer: one(gamePlayer, { fields: [play.gamePlayerId], references: [gamePlayer.id] }),
  beats: one(play, { fields: [play.beatsPlayId], references: [play.id], relationName: 'playBeats' }),
  cards: many(playCard),
}));

export const playCardRelations = relations(playCard, ({ one }) => ({
  play: one(play, { fields: [playCard.playId], references: [play.id] }),
  gameCard: one(gameCard, { fields: [playCard.gameCardId], references: [gameCard.id] }),
}));
