import { createFileRoute } from '@tanstack/react-router';
import { useDiscord } from './-_discord';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  const { status, user, error } = useDiscord();

  if (status === 'loading') return <p className="p-8 text-lg">Connecting to Discord…</p>;
  if (status === 'error') return <p className="p-8 text-lg">Failed to connect: {error?.message}</p>;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome, {user?.global_name ?? user?.username}</h1>
    </div>
  );
}
