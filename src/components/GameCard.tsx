import Link from 'next/link';
import type { Game } from '@/types';

export function GameCard({ game, index }: { game: Game; index: number }) {
    const image = game.images?.[0];

    return (
        <Link
            key={game.slug}
            href={`/games/${game.slug}`}
            className="game-card"
            style={{
                ['--card-accent' as any]: game.accent ?? '#7adba0',
                backgroundImage: image ? `url(${image})` : undefined,
            }}
        >
            <div className="game-card__visual" aria-hidden="true" style={image ? {
                backgroundImage: `linear-gradient(180deg, rgba(1,3,2,0.12), rgba(1,3,2,0.72)), url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            } : undefined}>
                <div className="game-card__visual-glow" />
                <div className="game-card__content">
                    <div className="game-card__text">
                        <p className="game-card__engine">{game.engine}</p>
                        <h3>{game.title}</h3>
                        {game.description ? <p className="game-card__description">{game.description}</p> : null}
                    </div>
                </div>
            </div>
        </Link>
    );
}
