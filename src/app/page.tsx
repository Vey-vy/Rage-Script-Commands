import { Footer } from '@/components/Footer';
import { GameCard } from '@/components/GameCard';
import { TopBar } from '@/components/TopBar';
import { getGames } from '@/lib/games';
import { getTranslation } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function Home() {
    const games = await getGames();
    const gameCount = games.length;
    const locale = 'en';

    return (
        <main className="page-shell">
            <TopBar />

            <section className="intro">
                <h1 className="intro-title">{getTranslation(locale, 'home.welcome')}</h1>
            </section>

            <section id="catalog" className="catalog" aria-labelledby="catalog-title">
                <div className="games-grid">
                    {games.map((game, index) => (
                        <GameCard key={game.slug} game={game} index={index} />
                    ))}
                </div>
            </section>

            <Footer />
        </main>
    );
}