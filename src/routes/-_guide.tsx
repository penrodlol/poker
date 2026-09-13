import { Typography } from '@heroui/react';

const sections = [
  {
    title: 'Card Order',
    keyWidth: 'sm:w-32',
    showKey: true,
    content: [
      { key: 'Values (low → high)', value: '3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, 2' },
      { key: 'Suits (low → high)', value: 'diamonds, clubs, hearts, spades' },
    ],
  },
  {
    title: 'Hand Types',
    keyWidth: 'sm:w-24',
    showKey: true,
    content: [
      { key: 'Single', value: 'Any one card' },
      { key: 'Pair', value: 'Two cards of the same value' },
      { key: 'Straight', value: 'Exactly 5 cards in sequential value order (any suits)' },
      { key: 'Flush', value: 'Exactly 5 cards all of the same suit (any values)' },
      { key: 'Full House', value: '3 cards of the same value + 2 cards of the same value' },
      { key: 'Straight Flush', value: 'Exactly 5 cards in sequential value order, all of the same suit' },
    ],
  },
  {
    title: 'Beating Hands',
    keyWidth: 'sm:w-24',
    showKey: true,
    content: [
      { key: 'Single', value: 'Higher single' },
      { key: 'Pair', value: 'Higher pair' },
      { key: 'Straight', value: 'Higher straight, flush, full house, or straight flush' },
      { key: 'Flush', value: 'Higher flush, full house, or straight flush' },
      { key: 'Full House', value: 'Higher full house or straight flush' },
      { key: 'Straight Flush', value: 'Higher straight flush only' },
    ],
  },
  {
    title: 'Turn Order & Round Flow',
    keyWidth: 'sm:w-auto',
    showKey: false,
    content: [
      {
        key: 'Opening Play',
        value: 'The player holding the 3 of diamonds goes first and must include it in their opening play.',
      },
      {
        key: 'Your Turn',
        value:
          'On your turn, play a valid combination that beats the current table play, or pass — passing locks you out for the rest of the round.',
      },
      {
        key: 'Round End',
        value:
          'A round ends when all players except one have passed. The last player to play starts the next round with any valid combination.',
      },
      { key: 'New Round', value: 'When a new round starts, all players re-enter and are no longer locked.' },
    ],
  },
];

export default function Guide() {
  return (
    <div className="flex flex-col gap-16 pt-8 sm:gap-10">
      {sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <Typography weight="semibold">{section.title}</Typography>
          <ul className="flex flex-col gap-2 sm:gap-4">
            {section.content.map((item) => (
              <li key={item.key} className="flex gap-x-4 not-sm:flex-col">
                {section.showKey && (
                  <Typography type="body-sm" className={section.keyWidth} render={(props) => <span {...props} />}>
                    {item.key}
                  </Typography>
                )}
                <Typography type="body-sm" render={(props) => <span {...props} />} className="text-muted">
                  {item.value}
                </Typography>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="flex flex-col gap-2">
        <Typography weight="semibold">Winning</Typography>
        <Typography type="body-sm" color="muted">
          The first player to play their last card(s) wins.
        </Typography>
      </section>
    </div>
  );
}
