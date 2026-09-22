'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Legal } from './Legal';
import { Tos } from './Tos';
import { useTranslation } from './I18nProvider';

export function Footer() {
    const year = new Date().getFullYear();
    const [isTosOpen, setIsTosOpen] = useState(false);
    const [isLegalOpen, setIsLegalOpen] = useState(false);
    const { t } = useTranslation();

    return (
        <>
            <footer className="footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <Link
                            href="/"
                            className="brand"
                            aria-label="Script Commands home"
                        >
                            <span>Script Commands</span>
                        </Link>
                    </div>

                    <nav className="footer-nav" aria-label="Footer Links">
                        <button
                            type="button"
                            className="footer-link footer-link-button"
                            onClick={() => setIsTosOpen(true)}
                        >
                            {t('footer.tos')}
                        </button>
                        <button
                            type="button"
                            className="footer-link footer-link-button"
                            onClick={() => setIsLegalOpen(true)}
                        >
                            {t('footer.legal')}
                        </button>
                    </nav>

                    <p className="footer-credit">
                        {t('footer.credit', { year })}
                    </p>
                </div>
            </footer>

            <Tos isOpen={isTosOpen} onClose={() => setIsTosOpen(false)} />
            <Legal isOpen={isLegalOpen} onClose={() => setIsLegalOpen(false)} />
        </>
    );
}