'use client';

import { useTranslation } from './I18nProvider';

type LegalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function Legal({ isOpen, onClose }: LegalProps) {
    const { locale, t } = useTranslation();
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="tos-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-title"
            onClick={onClose}
        >
            <div className="tos-modal" onClick={(event) => event.stopPropagation()}>
                <div className="tos-header">
                    <h2 id="legal-title">{t('footer.legal')}</h2>
                    <button
                        type="button"
                        className="tos-close"
                        aria-label={locale === 'fr' ? 'Fermer les mentions légales' : 'Close legal notice'}
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="tos-body">
                    <p>
                        This website is provided for informational and reference purposes
                        only. It may contain community-maintained data, metadata, and
                        script command references for RAGE-related titles.
                    </p>
                    <p>
                        All content is made available without any guarantee of
                        completeness, correctness, accuracy, availability, or fitness for
                        a specific purpose. Information may change without notice.
                    </p>
                    <p>
                        We do not warrant that the website will be free from errors,
                        interruptions, or security issues. Use of the site is at your own
                        risk.
                    </p>
                    <p>
                        The project may include references to third-party tools, assets,
                        services, or communities. Their availability and policies are
                        outside of our control.
                    </p>
                    <p>
                        By using this site, you agree not to misuse the platform, exploit
                        it for harmful or unlawful activity, or distribute content in a way
                        that violates the rights of others.
                    </p>
                </div>
            </div>
        </div>
    );
}
