'use client';

import { useTranslation } from './I18nProvider';

type TosProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function Tos({ isOpen, onClose }: TosProps) {
    const { locale, t } = useTranslation();
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="tos-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tos-title"
            onClick={onClose}
        >
            <div className="tos-modal" onClick={(event) => event.stopPropagation()}>
                <div className="tos-header">
                    <h2 id="tos-title">{t('footer.tos')}</h2>
                    <button
                        type="button"
                        className="tos-close"
                        aria-label={locale === 'fr' ? 'Fermer les conditions d’utilisation' : 'Close terms of service'}
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                <div className="tos-body">
                    <p>
                        By using this website, you agree to use the available content
                        responsibly and for lawful purposes only.
                    </p>
                    <p>
                        We provide references, metadata, and command information for
                        informational use. Nothing on this site is guaranteed to be
                        complete, updated, or error-free.
                    </p>
                    <p>
                        The platform may be updated, modified, or discontinued at any
                        time without prior notice.
                    </p>
                    <p>
                        We do not guarantee availability, continuity, or fitness for a
                        specific purpose.
                    </p>
                </div>
            </div>
        </div>
    );
}
