import type { QueryClient } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { I18nProvider, useLocale } from 'react-aria-components/I18nProvider';
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
    <I18nProvider>
      <ShellContent {...props} />
    </I18nProvider>
  );
}

function ShellContent(props: { children: React.ReactNode }) {
  const { locale, direction } = useLocale();

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <DiscordProvider>
          <header></header>
          <main {...props} />
          <footer></footer>
        </DiscordProvider>
        <Scripts />
      </body>
    </html>
  );
}
