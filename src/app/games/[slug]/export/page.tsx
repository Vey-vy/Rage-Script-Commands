import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGame } from '@/lib/games';
import ExportWorkspace from '@/components/export/ExportWorkspace';

type ExportPageProps = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ExportPageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  return game ? { title: `Export ${game.title}`, description: `Export ${game.title} commands` } : {};
}

export default async function ExportPage({ params }: ExportPageProps) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();

  return <ExportWorkspace commands={game.commands} gameTitle={game.title} gameSlug={game.slug} />;
}