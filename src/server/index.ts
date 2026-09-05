import fetch from './fetch';

export { GameChannelDurableObject } from './fetch/src/game-channel';
export default { fetch } satisfies ExportedHandler<Env>;
