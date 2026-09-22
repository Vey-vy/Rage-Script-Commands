'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '@/components/I18nProvider';
import type { Command } from '@/types';

interface NamespaceSidebarProps {
  namespaces: string[];
  activeNamespace: string;
  onNamespaceChange: (namespace: string) => void;
  commands: Command[];
  gameSlug: string;
}

export function NamespaceSidebar({
  namespaces,
  activeNamespace,
  onNamespaceChange,
  commands,
  gameSlug,
}: NamespaceSidebarProps) {
  const { t } = useTranslation();
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const command of commands) {
      const key = command.namespace ?? 'GLOBAL';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [commands]);

  const hasNamespaces = namespaces.length > 0;

  return (
    <aside className="native-sidebar" aria-label="Namespace navigation">
      <nav className="native-sidebar__nav">
        <Link className="native-sidebar__link" href="/">
          <span className="native-sidebar__icon">&larr;</span>
          <span className="native-sidebar__label">{t('nav.allGames')}</span>
        </Link>
        <button
          className={`native-sidebar__link ${activeNamespace === 'all' ? 'is-active' : ''}`}
          onClick={() => onNamespaceChange('all')}
          type="button"
        >
          <span className="native-sidebar__icon">&#9776;</span>
          <span className="native-sidebar__label">{t('browser.allCommands')}</span>
        </button>
      </nav>

      {hasNamespaces && (
        <div className="native-sidebar__namespaces">
          <p className="native-sidebar__section-title">{t('browser.namespaces')}</p>
          {namespaces.map((namespace) => (
            <button
              className={`native-sidebar__namespace ${activeNamespace === namespace ? 'is-active' : ''}`}
              key={namespace}
              onClick={() => onNamespaceChange(namespace)}
              type="button"
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span>{namespace}</span>
                <em>{counts.get(namespace) ?? 0}</em>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="native-sidebar__export">
        <Link href={`/games/${gameSlug}/export`}>{t('browser.exportWorkspace')} &#8599;</Link>
      </div>
    </aside>
  );
}