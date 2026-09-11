import { ToastProvider } from '@heroui/react/toast';
import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import css from '../styles.css?url';
import { DiscordProvider } from './-_discord';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Poker' }],
    links: [{ rel: 'stylesheet', href: css }],
  }),
  shellComponent: Shell,
});

function Shell(props: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="to-surface via-surface-secondary from-surface-tertiary flex min-h-svh flex-col bg-radial">
        <DiscordProvider>
          <header></header>
          <main className="flex-1" {...props} />
          <footer></footer>
        </DiscordProvider>
        <ToastProvider placement="top" />
        <Scripts />
      </body>
    </html>
  );
}
