import type { Player } from '#/db/schema';
import { Server } from 'partyserver';

export type GameChannelMessageType = 'update' | 'gameover';
export type GameChannelMessage =
  | { type: Extract<GameChannelMessageType, 'update'>; data: null }
  | { type: Extract<GameChannelMessageType, 'gameover'>; data: GameChannelMessageDataGameOver };

export type GameChannelMessageDataGameOver = Pick<Player, 'discordId' | 'username'>;

export class GameChannelDurableObject extends Server<Env> {
  static options = { hibernate: true };

  notify(message: GameChannelMessage = { type: 'update', data: null }) {
    this.broadcast(JSON.stringify(message));
  }
}
