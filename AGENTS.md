# AGENTS.md — Custom Card Game

## Overview

This is a custom card game (not standard poker) where players race to empty their hand. The agent is responsible for managing game state, validating plays, and enforcing turn order.

---

## Reference Documentation

Detailed design docs live in [`docs/`](docs/). Consult them for implementation context:

- [Database Schema Plan](docs/database-schema-plan.md) — tables, relations, and how the rules map to persistence.
- [Technical Reference](docs/technical-reference.md) — central technical reference hub; how the app runs inside Discord as an embedded Activity and links to detailed topic docs.
- [Phase 1 — Boot the Activity & Auth Plan](docs/phase-1-boot-activity-auth-plan.md) — implementation plan for the Discord Activity launch and OAuth handshake.

---

## Coding Conventions

- **Do not add comments to code.** Do not write inline comments, block comments, or doc comments. Write clear, self-explanatory code instead of explaining it with comments. Only add a comment if the user explicitly requests one.
- **Prefer concise, inline syntax.** Omit curly braces where the language allows (e.g. single-statement `if`/`for` bodies, arrow functions with implicit returns). Keep expressions on a single line whenever it stays readable.

---

## Deck & Deal

- Standard 52-card deck (no jokers).
- Cards are dealt evenly among all players. If the deck does not divide evenly, remaining cards are discarded or handled per implementation preference.
- Suits: diamonds, clubs, hearts, spades.
- Values (low → high): 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, 2.
- Suits (low → high): diamonds, clubs, hearts, spades.

---

## Objective

Be the first player to play all cards from your hand.

---

## Valid Hand Types

A player may play one of the following combinations per turn:

| Type               | Definition                                                      |
| ------------------ | --------------------------------------------------------------- |
| **Single**         | Any one card                                                    |
| **Pair**           | Two cards of the same value                                     |
| **Straight**       | Exactly 5 cards in sequential value order (any suits)           |
| **Flush**          | Exactly 5 cards all of the same suit (any values)               |
| **Full House**     | 3 cards of the same value + 2 cards of the same value           |
| **Straight Flush** | Exactly 5 cards in sequential value order, all of the same suit |

Any play that does not match one of these types is invalid and must be rejected.

---

## Beating a Play

A played combination can only be beaten by a **higher** combination of an equal or superior type. Type promotion rules:

| Current Play   | Can Be Beaten By                                      |
| -------------- | ----------------------------------------------------- |
| Single         | Higher single                                         |
| Pair           | Higher pair                                           |
| Straight       | Higher straight, flush, full house, or straight flush |
| Flush          | Higher flush, full house, or straight flush           |
| Full House     | Higher full house or straight flush                   |
| Straight Flush | Higher straight flush only                            |

### Determining "Higher"

- **Singles & Pairs**: Compare card values first; if equal, compare suits.
- **Straights**: Compare the highest card in the straight by value, then suit.
- **Flushes**: Compare the highest card in the flush by value, then suit.
- **Full Houses**: Compare the value of the three-of-a-kind portion.
- **Straight Flushes**: Compare the highest card by value, then suit.

---

## Turn Order & Round Flow

1. **First turn**: The player holding the **3 of diamonds** goes first and must include it in their opening play.
2. **Subsequent turns**: Play proceeds clockwise (or in defined player order).
3. On their turn, a player must either:
   - Play a valid combination that beats the current table play, or
   - **Pass** — they are then locked out for the remainder of the round.
4. A **round ends** when all players except one have passed. The last player to successfully play a combination starts the next round and may play any valid combination (no table play to beat).
5. A player who wins a round and starts the next round is **no longer locked** — all players re-enter.

---

## Winning

The first player to play their last card(s) wins. The game may continue for remaining players to determine placement order.
