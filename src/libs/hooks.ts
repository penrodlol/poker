import JSConfetti from 'js-confetti';
import { useEffect, useRef, useState } from 'react';

const jsConfetti = new JSConfetti();

export function useResizeObserver(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => setSize({ width: element.clientWidth, height: element.clientHeight }));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

export function useConfetti(enabled: boolean) {
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return void (hasFiredRef.current = false);
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    jsConfetti.addConfetti({ emojis: ['♣️', '♠️', '♥️', '♦️'], emojiSize: 40 });
  }, [enabled]);
}
