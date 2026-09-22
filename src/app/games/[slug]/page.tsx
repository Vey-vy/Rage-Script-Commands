import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CommandBrowser from '@/components/command-browser/CommandBrowser';
import { TopBar } from '@/components/TopBar';
import { getGame } from '@/lib/games';

type GamePageProps = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return game ? { title: game.title, description: game.description } : {};
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();

  return (
    <main className="page-shell game-page-shell">
      <TopBar />

      <div className="content-panel">
        <CommandBrowser commands={game.commands} gameTitle={game.title} gameSlug={game.slug} />
      </div>
    </main>
  );
}