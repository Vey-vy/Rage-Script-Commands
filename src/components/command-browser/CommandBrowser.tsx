'use client';

import { useMemo, useState } from 'react';
import type { Command } from '@/types';
import { NamespaceSidebar } from './NamespaceSidebar';
import { Toolbar } from './Toolbar';
import { CommandTable } from './CommandTable';
import { InspectorModal } from './InspectorModal';

type Column = 'name' | 'syntax' | 'invoke' | 'namespace' | 'returnType' | 'hash';

export default function CommandBrowser({
  commands,
  gameTitle,
  gameSlug,
}: {
  commands: Command[];
  gameTitle: string;
  gameSlug: string;
}) {
  const [query, setQuery] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState('all');
  const [buildFilter, setBuildFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeName, setActiveName] = useState(commands[0]?.name ?? '');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [columns, setColumns] = useState<Column[]>(['name']);
  const [showColumns, setShowColumns] = useState(false);

  const namespaces = useMemo(
    () =>
      Array.from(
        new Set(
          commands
            .map((command) => command.namespace)
            .filter((namespace): namespace is string => Boolean(namespace))
        )
      ).sort(),
    [commands]
  );

  const buildOptions = useMemo(
    () => Array.from(new Set(commands.map((command) => command.build).filter((build): build is string => Boolean(build)))).sort(),
    [commands]
  );

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return commands
      .filter((command) => {
        const matchesQuery =
          !normalizedQuery ||
          `${command.name} ${command.syntax} ${command.comment ?? ''} ${command.hash ?? ''}`
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesNamespace = namespaceFilter === 'all' || command.namespace === namespaceFilter;
        const matchesBuild = buildFilter === 'all' || command.build === buildFilter;
        return matchesQuery && matchesNamespace && matchesBuild;
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [buildFilter, commands, query, namespaceFilter]);

  const activeCommand = commands.find((command) => command.name === activeName) ?? filteredCommands[0];

  const allSelected = useMemo(
    () => filteredCommands.length > 0 && filteredCommands.every((command) => selected.has(command.name)),
    [filteredCommands, selected]
  );

  function handleRowClick(command: Command) {
    setActiveName(command.name);
    setIsInspectorOpen(true);
  }

  function toggleSelected(name: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectAll() {
    setSelected((current) => new Set([...current, ...filteredCommands.map((command) => command.name)]));
  }

  function selectNone() {
    setSelected(
      (current) => new Set(Array.from(current).filter((name) => !filteredCommands.some((command) => command.name === name)))
    );
  }

  return (
    <div aria-label={`${gameTitle} command explorer`} className="command-browser-shell">
      <NamespaceSidebar
        activeNamespace={namespaceFilter}
        commands={commands}
        gameSlug={gameSlug}
        namespaces={namespaces}
        onNamespaceChange={setNamespaceFilter}
      />

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Toolbar
          allSelected={allSelected}
          buildFilter={buildFilter}
          buildOptions={buildOptions}
          columns={columns}
          commands={commands}
          filteredCount={filteredCommands.length}
          gameSlug={gameSlug}
          onBuildFilterChange={setBuildFilter}
          onColumnsChange={setColumns}
          onQueryChange={setQuery}
          onSelectAll={selectAll}
          onSelectNone={selectNone}
          onShowColumnsChange={setShowColumns}
          query={query}
          selectedCount={selected.size}
          showColumns={showColumns}
        />

        <div className="flex-1 flex overflow-hidden relative min-h-0">
          <div className="flex-1 min-w-0 h-full">
            <CommandTable
              activeName={activeCommand?.name ?? ''}
              allSelected={allSelected}
              columns={columns}
              commands={filteredCommands}
              onRowClick={handleRowClick}
              onSelectAll={selectAll}
              onSelectNone={selectNone}
              onSelectToggle={toggleSelected}
              selected={selected}
            />
          </div>

          <InspectorModal command={activeCommand} isOpen={isInspectorOpen} onClose={() => setIsInspectorOpen(false)} />
        </div>
      </main>
    </div>
  );
}