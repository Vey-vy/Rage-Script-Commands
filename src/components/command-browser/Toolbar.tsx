'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { useTranslation } from '@/components/I18nProvider';
import type { Command } from '@/types';

type Column = 'name' | 'syntax' | 'invoke' | 'namespace' | 'returnType' | 'hash';

const columnLabels: Record<Column, string> = {
  name: 'Name',
  syntax: 'Signature',
  invoke: 'Invoke',
  namespace: 'Namespace',
  returnType: 'Returns',
  hash: 'Hash',
};

interface ToolbarProps {
  commands: Command[];
  query: string;
  onQueryChange: (value: string) => void;
  buildFilter: string;
  buildOptions: string[];
  onBuildFilterChange: (value: string) => void;
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  showColumns: boolean;
  onShowColumnsChange: (value: boolean) => void;
  filteredCount: number;
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onSelectNone: () => void;
  gameSlug: string;
}

export function Toolbar({
  commands,
  query,
  onQueryChange,
  buildFilter,
  buildOptions,
  onBuildFilterChange,
  columns,
  onColumnsChange,
  showColumns,
  onShowColumnsChange,
  filteredCount,
  selectedCount,
  allSelected,
  onSelectAll,
  onSelectNone,
  gameSlug,
}: ToolbarProps) {
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!showColumns) return;
    function handleClickOutside(event: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        onShowColumnsChange(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumns, onShowColumnsChange]);

  function toggleColumn(column: Column) {
    if (columns.includes(column)) {
      onColumnsChange(columns.filter((item) => item !== column));
    } else {
      onColumnsChange([...columns, column]);
    }
  }

  return (
    <div className="native-banner">
      <div className="native-banner__row">
        <h1 className="native-banner__title">{t('browser.natives')}</h1>

        <div className="native-banner__search">
          <span className="native-banner__icon">&#8981;</span>
          <input
            aria-label={t('browser.searchLabel')}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t('browser.searchPlaceholder')}
            value={query}
          />
          {query && (
            <button aria-label={t('browser.clearSearch')} onClick={() => onQueryChange('')} type="button">
              &times;
            </button>
          )}
        </div>

        <div className="native-banner__filter">
          <select
            aria-label="Filter natives by build"
            className="native-banner__filter-select"
            onChange={(event) => onBuildFilterChange(event.target.value)}
            value={buildFilter}
          >
            <option value="all">{t('browser.allBuilds')}</option>
            {buildOptions.map((build) => (
              <option key={build} value={build}>
                {build}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="native-banner__meta">
        <span>
          {filteredCount.toLocaleString()} {t('browser.of')} {commands.length.toLocaleString()} {t('browser.natives')}
        </span>
        {selectedCount > 0 && <span>&middot; {selectedCount.toLocaleString()} {t('browser.selected')}</span>}
        <Link href={`/games/${gameSlug}/export`}>{t('browser.openExport')} &#8599;</Link>
      </div>
    </div>
  );
}