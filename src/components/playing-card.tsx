import type { CardRank, CardSuite } from '#/db';
import { proxyDiscordUrl } from '#/libs/discord';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

export type PlayingCardProps = React.ComponentProps<'img'> & PlayingCardVariants & { rank: CardRank; suit: CardSuite };

export type PlayingCardVariants = VariantProps<typeof playingCardVariants>;

export const playingCardVariants = tv({
  base: 'rounded-lg bg-neutral-200 p-1 select-none',
  defaultVariants: { size: 'md' },
  variants: { size: { sm: 'w-16', md: 'w-24', lg: 'w-32' } },
});

export default function PlayingCard({ className, size, rank, suit, ...props }: PlayingCardProps) {
  return (
    <img
      src={proxyDiscordUrl(`/.proxy/r2/cards/${rank}_${suit}.png`)}
      alt={`${rank} of ${suit}`}
      width={222}
      height={323}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      className={playingCardVariants({ size, className })}
      {...props}
    />
  );
}
