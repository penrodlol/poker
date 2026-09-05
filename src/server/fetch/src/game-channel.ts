import { Server } from 'partyserver';

export type GameChannelMessage = { type: 'update' };

export class GameChannelDurableObject extends Server<Env> {
  static options = { hibernate: true };

  notify() {
    this.broadcast(JSON.stringify({ type: 'update' } satisfies GameChannelMessage));
  }
}
