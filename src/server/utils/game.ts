import { CARD_RANKS, CARD_SUITS, type CardRank, type CardSuite } from '#/db/schema';

export type GameHandType = 'single' | 'pair' | 'straight' | 'flush' | 'full_house' | 'straight_flush';
export type GameHandCard = { rank: CardRank; suit: CardSuite };
export type GameEvaluatedHand = { type: GameHandType; strength: number };

const GAME_FIVE_CARD_TYPES = ['straight', 'flush', 'full_house', 'straight_flush'] as const;

const gameCardValue = (card: GameHandCard) => CARD_RANKS.indexOf(card.rank) * CARD_SUITS.length + CARD_SUITS.indexOf(card.suit);
const gameFiveCardRank = (type: GameHandType) => (GAME_FIVE_CARD_TYPES as ReadonlyArray<GameHandType>).indexOf(type);

export function sortGameCards<T extends GameHandCard>(cards: Array<T>): Array<T> {
  return [...cards].sort((a, b) => gameCardValue(a) - gameCardValue(b));
}

export function evaluateGameHand(cards: Array<GameHandCard>): GameEvaluatedHand | null {
  if (cards.length === 1) return { type: 'single', strength: gameCardValue(cards[0]) };
  if (cards.length === 2) return cards[0].rank === cards[1].rank ? { type: 'pair', strength: Math.max(...cards.map(gameCardValue)) } : null;
  if (cards.length !== 5) return null;

  const ranks = cards.map((card) => CARD_RANKS.indexOf(card.rank)).sort((a, b) => a - b);
  const isFlush = cards.every((card) => card.suit === cards[0].suit);
  const isStraight = ranks.every((rank, index) => index === 0 || rank === ranks[index - 1] + 1);
  const top = Math.max(...cards.map(gameCardValue));

  if (isStraight && isFlush) return { type: 'straight_flush', strength: top };
  if (isStraight) return { type: 'straight', strength: top };
  if (isFlush) return { type: 'flush', strength: top };

  const counts = new Map<number, number>();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const tripleRank = [...counts].find(([, count]) => count === 3)?.[0];
  const hasPair = [...counts].some(([, count]) => count === 2);
  if (tripleRank !== undefined && hasPair) return { type: 'full_house', strength: tripleRank };

  return null;
}

export function gameBeats(candidate: GameEvaluatedHand, current: GameEvaluatedHand): boolean {
  if (current.type === 'single' || current.type === 'pair') return candidate.type === current.type && candidate.strength > current.strength;

  const candidateRank = gameFiveCardRank(candidate.type);
  const currentRank = gameFiveCardRank(current.type);
  if (candidateRank === -1) return false;
  if (candidateRank !== currentRank) return candidateRank > currentRank;
  return candidate.strength > current.strength;
}
