'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/I18nProvider';

type Format = 'json' | 'hpp';

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface ExportOptionsProps {
  gameTitle: string;
  gameSlug: string;
  format: Format;
  setFormat: (format: Format) => void;
  query: string;
  setQuery: (query: string) => void;
  hppInvokerName: string;
  setHppInvokerName: (value: string) => void;
  includeComments: boolean;
  setIncludeComments: (value: boolean) => void;
  includeMetadata: boolean;
  setIncludeMetadata: (value: boolean) => void;
  visibleCount: number;
  content: string;
}

export function ExportOptions({
  gameTitle,
  gameSlug,
  format,
  setFormat,
  query,
  setQuery,
  hppInvokerName,
  setHppInvokerName,
  includeComments,
  setIncludeComments,
  includeMetadata,
  setIncludeMetadata,
  visibleCount,
  content,
}: ExportOptionsProps) {
  const { t } = useTranslation();

  function handleDownload() {
    const filename = `${gameTitle.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    const mimeType = format === 'json' ? 'application/json' : 'text/plain';
    download(filename, content, mimeType);
  }

  return (
    <aside className="export-panel" aria-label="Export options">
      <div className="export-panel__header">
        <Link className="export-panel__back" href={`/games/${gameSlug}`}>
          &larr; {t('export.backExplorer')}
        </Link>
        <h1 className="export-panel__title">{t('export.title')}</h1>
        <p className="export-panel__subtitle">{gameTitle}</p>
      </div>

      <div className="export-panel__body">
        <section className="export-panel__section">
          <p className="export-panel__label">01 / {t('export.format')}</p>
          <div className="export-format-grid">
            <button
              className={`export-format-button ${format === 'json' ? 'is-active' : ''}`}
              onClick={() => setFormat('json')}
              type="button"
            >
              {t('export.json')}
              <span>{t('common.data') ?? 'Data'}</span>
            </button>
            <button
              className={`export-format-button ${format === 'hpp' ? 'is-active' : ''}`}
              onClick={() => setFormat('hpp')}
              type="button"
            >
              {t('export.hpp')}
              <span>{t('common.cppHeader') ?? 'C++ header'}</span>
            </button>
          </div>
        </section>

        <section className="export-panel__section">
          <p className="export-panel__label">02 / {t('export.filter')}</p>
          <div className="export-search">
            <input
              aria-label="Filter commands"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('export.filterPlaceholder')}
              value={query}
            />
          </div>
        </section>

        {format === 'hpp' && (
          <section className="export-panel__section">
            <p className="export-panel__label">03 / {t('export.invoker')}</p>
            <div className="export-search">
              <input
                aria-label="Invoker helper name"
                onChange={(event) => setHppInvokerName(event.target.value)}
                placeholder={t('export.invokerPlaceholder')}
                value={hppInvokerName}
              />
            </div>
          </section>
        )}

        <section className="export-panel__section">
          <p className="export-panel__label">{format === 'hpp' ? '04' : '03'} / {t('export.content')}</p>
          <label className="export-option">
            <input
              checked={includeMetadata}
              onChange={(event) => setIncludeMetadata(event.target.checked)}
              type="checkbox"
            />
            <span>{t('export.includeMetadata')}</span>
          </label>
          <label className="export-option">
            <input
              checked={includeComments}
              onChange={(event) => setIncludeComments(event.target.checked)}
              type="checkbox"
            />
            <span>{t('export.includeComments')}</span>
          </label>
        </section>
      </div>

      <div className="export-panel__footer">
        <button className="export-download" onClick={handleDownload} type="button">
          {t('export.download')} {format.toUpperCase()} &#8595;
        </button>
        <p className="export-hint">{t('export.visibleCount', { count: visibleCount.toLocaleString() })}</p>
      </div>
    </aside>
  );
}