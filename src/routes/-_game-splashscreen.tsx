import PlayingCard from '#/components/playing-card';
import { Spinner, Typography } from '@heroui/react';

export type GameSplashscreenProps = { loadingMessage: string };

export default function GameSplashscreen({ loadingMessage }: GameSplashscreenProps) {
  return (
    <section className="flex min-h-svh flex-col items-center justify-center gap-8 p-4">
      <div className="*:motion-safe:animation-duration-[1000ms] flex justify-center gap-8 *:motion-safe:animate-bounce">
        <PlayingCard rank="5" suit="spades" />
        <PlayingCard rank="5" suit="hearts" style={{ animationDelay: `${1 * 0.15}s` }} />
        <PlayingCard rank="5" suit="diamonds" style={{ animationDelay: `${2 * 0.15}s` }} />
        <PlayingCard rank="5" suit="clubs" style={{ animationDelay: `${3 * 0.15}s` }} />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <Typography type="h1" weight="bold" className="text-5xl">
          中国人 POKER
        </Typography>
        <Typography color="muted">Play your cards, outsmart your opponents, and take the win</Typography>
      </div>
      <div className="flex items-center gap-2">
        <Spinner color="accent" />
        <Typography>{loadingMessage}</Typography>
      </div>
    </section>
  );
}
