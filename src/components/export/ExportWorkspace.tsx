'use client';

import { useMemo, useState } from 'react';
import type { Command } from '@/types';
import { ExportOptions } from './ExportOptions';
import { ExportPreview } from './ExportPreview';

type Format = 'json' | 'hpp';

function toHpp(commands: Command[], includeComments: boolean, invokerName: string): string {
  const helperName = invokerName.trim() || 'invoke';
  const grouped = new Map<string, Command[]>();

  for (const command of commands) {
    const namespaceName = command.namespace ?? 'GLOBAL';
    const existing = grouped.get(namespaceName) ?? [];
    existing.push(command);
    grouped.set(namespaceName, existing);
  }

  const blocks: string[] = ['#pragma once', ''];

  for (const [namespaceName, namespaceCommands] of Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right))) {
    blocks.push(`namespace ${namespaceName} {`);

    for (const command of namespaceCommands) {
      const params = command.params && command.params.length > 0
        ? command.params.map((param) => `${param.type ?? 'any'} ${param.name ?? 'arg'}`).join(', ')
        : '';
      const args = command.params && command.params.length > 0
        ? command.params.map((param) => param.name ?? 'arg').join(', ')
        : '';
      const hash = command.hash ?? '0x0';
      const returnType = command.returnType ?? 'void';

      if (includeComments && command.comment) {
        blocks.push(`    // ${command.comment.replace(/\n/g, ' ')}`);
      }

      blocks.push(`    static ${returnType} ${command.name}(${params}) {`);
      blocks.push(`        return ${helperName}<${returnType}>(${hash}, ${args});`);
      blocks.push('    }');
      blocks.push('');
    }

    blocks.push('}');
    blocks.push('');
  }

  return blocks.join('\n');
}

export default function ExportWorkspace({ commands, gameTitle, gameSlug }: { commands: Command[]; gameTitle: string; gameSlug?: string }) {
  const [format, setFormat] = useState<Format>('json');
  const [query, setQuery] = useState('');
  const [includeComments, setIncludeComments] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [hppInvokerName, setHppInvokerName] = useState('invoke');

  const visibleCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return commands.filter(
      (command) =>
        !normalized ||
        `${command.name} ${command.namespace ?? ''} ${command.comment ?? ''}`.toLowerCase().includes(normalized)
    );
  }, [commands, query]);

  const content = useMemo(() => {
    if (format === 'json') {
      return JSON.stringify(
        includeMetadata
          ? visibleCommands
          : visibleCommands.map(({ name, syntax, namespace, returnType, params }) => ({
            name,
            syntax,
            namespace,
            returnType,
            params,
          })),
        null,
        2
      );
    }
    return toHpp(visibleCommands, includeComments, hppInvokerName);
  }, [visibleCommands, format, includeComments, includeMetadata, hppInvokerName]);

  return (
    <div aria-label={`${gameTitle} export workspace`} className="export-shell">
      <ExportOptions
        content={content}
        format={format}
        gameSlug={gameSlug}
        gameTitle={gameTitle}
        hppInvokerName={hppInvokerName}
        includeComments={includeComments}
        includeMetadata={includeMetadata}
        query={query}
        setFormat={setFormat}
        setHppInvokerName={setHppInvokerName}
        setIncludeComments={setIncludeComments}
        setIncludeMetadata={setIncludeMetadata}
        setQuery={setQuery}
        visibleCount={visibleCommands.length}
      />

      <ExportPreview content={content} format={format} visibleCount={visibleCommands.length} />
    </div>
  );
}