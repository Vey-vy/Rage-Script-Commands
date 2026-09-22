'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Command } from '@/types';
import { Badge, Checkbox } from '@/components/ui';
import { NativeCode } from './NativeCode';

type Column = 'name' | 'syntax' | 'invoke' | 'namespace' | 'returnType' | 'hash';

const columnLabels: Record<Column, string> = {
  name: 'Name',
  syntax: 'Signature',
  invoke: 'Invoke',
  namespace: 'Namespace',
  returnType: 'Returns',
  hash: 'Hash',
};

const ROW_HEIGHT = 42;
const OVERSCAN = 10;

interface CommandTableProps {
  commands: Command[];
  columns: Column[];
  activeName: string;
  selected: Set<string>;
  onRowClick: (command: Command) => void;
  onSelectToggle: (name: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  allSelected: boolean;
}

type FlatItem =
  | { kind: 'group'; namespace: string; count: number }
  | { kind: 'row'; command: Command };

function invokeSignature(command: Command): string {
  const hash = command.hash ?? 'HASH';
  const returnType = command.returnType ?? 'void';
  const args = command.params?.map((param) => param.name).join(', ') ?? '';
  return `Invoke<${hash}, ${returnType}>(${args})`;
}

function nativeSignature(command: Command): string {
  const args = command.params?.map((param) => `${param.type ?? 'void'} ${param.name}`).filter(Boolean).join(', ') ?? '';
  return `${command.returnType ?? 'void'} ${command.name}(${args})`;
}

function columnValue(command: Command, column: Column) {
  switch (column) {
    case 'name':
      return (
        <div className="native-table__name">
          <code className="native-code">
            <span className="tok-type">{command.returnType ?? 'void'}</span>
            <span className="tok-function"> {command.name}</span>
            <span className="tok-punct">(</span>
            <span className="native-table__signature">
              {command.params?.map((param) => `${param.type ?? 'void'} ${param.name}`).filter(Boolean).join(', ') || 'void'}
            </span>
            <span className="tok-punct">)</span>
          </code>
        </div>
      );
    case 'invoke':
      return <NativeCode code={invokeSignature(command)} />;
    case 'syntax':
      return <NativeCode code={command.syntax} />;
    case 'namespace':
      return command.namespace ? (
        <Badge size="sm" variant="info">
          {command.namespace}
        </Badge>
      ) : (
        <span className="muted">GLOBAL</span>
      );
    case 'returnType':
      return command.returnType ? <NativeCode code={command.returnType} /> : <span className="muted">void</span>;
    case 'hash':
      return command.hash ? <NativeCode code={command.hash} /> : <span className="muted">N/A</span>;
    default:
      return null;
  }
}

function useVirtualRange(itemCount: number, containerRef: React.RefObject<HTMLDivElement | null>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    function syncScroll() {
      setScrollTop(node!.scrollTop);
    }
    function syncSize() {
      setViewportHeight(node!.clientHeight);
    }

    syncSize();
    node.addEventListener('scroll', syncScroll, { passive: true });

    const observer = new ResizeObserver(syncSize);
    observer.observe(node);

    return () => {
      node.removeEventListener('scroll', syncScroll);
      observer.disconnect();
    };
  }, [containerRef]);

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(itemCount, startIndex + Math.max(visibleCount, 0));

  return { startIndex, endIndex };
}

export function CommandTable({
  commands,
  columns,
  activeName,
  selected,
  onRowClick,
  onSelectToggle,
  onSelectAll,
  onSelectNone,
  allSelected,
}: CommandTableProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const flatItems = useMemo<FlatItem[]>(() => {
    const groups = new Map<string, Command[]>();
    for (const command of commands) {
      const namespace = command.namespace ?? 'GLOBAL';
      if (!groups.has(namespace)) groups.set(namespace, []);
      groups.get(namespace)!.push(command);
    }

    const sortedGroups = Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));

    const items: FlatItem[] = [];
    for (const [namespace, namespaceCommands] of sortedGroups) {
      items.push({ kind: 'group', namespace, count: namespaceCommands.length });
      for (const command of namespaceCommands) {
        items.push({ kind: 'row', command });
      }
    }
    return items;
  }, [commands]);

  const { startIndex, endIndex } = useVirtualRange(flatItems.length, wrapRef);

  if (!commands.length) {
    return (
      <div className="native-empty-state">
        <p>No commands match this view.</p>
      </div>
    );
  }

  const visibleItems = flatItems.slice(startIndex, endIndex);
  const topSpacer = startIndex * ROW_HEIGHT;
  const bottomSpacer = (flatItems.length - endIndex) * ROW_HEIGHT;
  const columnCount = columns.length + 1;

  return (
    <div className="native-table-wrap" ref={wrapRef}>
      <table className="native-table" role="grid">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{columnLabels[column]}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {topSpacer > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columnCount} style={{ height: topSpacer, padding: 0, border: 0 }} />
            </tr>
          )}

          {visibleItems.map((item) =>
            item.kind === 'group' ? (
              <tr className="native-table__group-header" key={`group-${item.namespace}`}>
                <td colSpan={columnCount}>
                  <div className="native-table__group">
                    <span>{item.namespace}</span>
                    <em>{item.count} natives</em>
                  </div>
                </td>
              </tr>
            ) : (
              <tr
                className={activeName === item.command.name ? 'is-active' : ''}
                key={item.command.name}
                onClick={() => onRowClick(item.command)}
              >
                {columns.map((column) => (
                  <td key={column}>{columnValue(item.command, column)}</td>
                ))}
              </tr>
            )
          )}

          {bottomSpacer > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columnCount} style={{ height: bottomSpacer, padding: 0, border: 0 }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}