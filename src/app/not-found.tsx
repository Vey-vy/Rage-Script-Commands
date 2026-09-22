'use client';

import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { TopBar } from '@/components/TopBar';
import { useTranslation } from '@/components/I18nProvider';

export default function NotFound() {
    const { t } = useTranslation();

    return (
        <main className="page-shell not-found-page">
            <TopBar />

            <section className="not-found" aria-live="polite">
                <div className="not-found__content">
                    <p className="not-found__eyebrow">404</p>
                    <h1 className="not-found__title">{t('notFound.title')}</h1>
                    <p className="not-found__text">{t('notFound.text')}</p>
                    <Link href="/" className="not-found__link">
                        {t('notFound.cta')}
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
