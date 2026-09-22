'use client';

import { Badge } from '@/components/ui';
import { useTranslation } from '@/components/I18nProvider';
import { CodeBlock } from './CodeBlock';

const PREVIEW_LIMIT = 18000;

interface ExportPreviewProps {
  content: string;
  visibleCount: number;
  format: 'json' | 'hpp';
}

export function ExportPreview({ content, visibleCount, format }: ExportPreviewProps) {
  const { t } = useTranslation();
  const previewContent = content.length > PREVIEW_LIMIT ? `${content.slice(0, PREVIEW_LIMIT)}\n...` : content;

  return (
    <section className="export-preview" aria-label={t('export.previewLabel')}>
      <div className="export-preview__header">
        <span className="export-preview__title">{t('export.preview')}</span>
        <Badge size="sm" variant="info">
          {visibleCount.toLocaleString()} {t('browser.commands')}
        </Badge>
      </div>

      <div className="export-code-wrap">
        <CodeBlock code={previewContent} language={format === 'json' ? 'json' : 'cpp'} />
      </div>
    </section>
  );
}