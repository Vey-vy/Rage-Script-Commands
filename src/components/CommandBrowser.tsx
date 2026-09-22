"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/components/I18nProvider";
import type { Command } from "@/types";

type Column = "name" | "syntax" | "invoke" | "namespace" | "returnType" | "hash";

export default function CommandBrowser({ commands, gameTitle, gameSlug }: { commands: Command[]; gameTitle: string; gameSlug: string }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [group, setGroup] = useState("all");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [activeName, setActiveName] = useState(commands[0]?.name ?? "");
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [columns, setColumns] = useState<Column[]>(["name", "syntax", "invoke", "returnType"]);
    const [showColumns, setShowColumns] = useState(false);

    const columnLabels: Record<Column, string> = {
        name: t('browser.columns.name'),
        syntax: t('browser.columns.signature'),
        invoke: t('browser.columns.invoke'),
        namespace: t('browser.columns.namespace'),
        returnType: t('browser.columns.returns'),
        hash: t('browser.columns.hash'),
    };

    const groups = useMemo(() => Array.from(new Set(commands.map((command) => command.namespace).filter(Boolean))).sort(), [commands]);
    const filteredCommands = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return commands.filter((command) => {
            const matchesQuery = !normalizedQuery || `${command.name} ${command.syntax} ${command.comment ?? ""} ${command.hash ?? ""}`.toLowerCase().includes(normalizedQuery);
            const matchesGroup = group === "all" || command.namespace === group;
            return matchesQuery && matchesGroup;
        }).sort((left, right) => left.name.localeCompare(right.name));
    }, [commands, group, query]);

    const groupedCommands = useMemo(() => {
        const groups = new Map<string, Command[]>();
        for (const command of filteredCommands) {
            const namespace = command.namespace ?? "GLOBAL";
            groups.set(namespace, [...(groups.get(namespace) ?? []), command]);
        }
        return Array.from(groups.entries());
    }, [filteredCommands]);

    const activeCommand = commands.find((command) => command.name === activeName) ?? filteredCommands[0];
    useEffect(() => {
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setIsInspectorOpen(false);
        }
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, []);

    function toggleSelected(name: string) {
        setSelected((current) => {
            const next = new Set(current);
            if (next.has(name)) next.delete(name); else next.add(name);
            return next;
        });
    }

    function toggleColumn(column: Column) {
        setColumns((current) => current.includes(column) ? current.filter((item) => item !== column) : [...current, column]);
    }

    function toggleAllVisible() {
        setSelected((current) => {
            const allVisibleSelected = filteredCommands.every((command) => current.has(command.name));
            if (allVisibleSelected) {
                return new Set(Array.from(current).filter((name) => !filteredCommands.some((command) => command.name === name)));
            }
            return new Set([...current, ...filteredCommands.map((command) => command.name)]);
        });
    }

    function columnValue(command: Command, column: Column) {
        if (column === "name") return <code>{command.name}</code>;
        if (column === "invoke") return invokeSignature(command);
        return command[column] || "-";
    }

    return (
        <section className="explorer" aria-label={`${gameTitle} command explorer`}>
            <div className="explorer-toolbar">
                <div className="search-field"><span>⌕</span><input id="command-search" onChange={(event) => setQuery(event.target.value)} placeholder={t('browser.searchPlaceholder')} value={query} />{query && <button aria-label={t('browser.clearSearch')} className="search-clear" onClick={() => setQuery("")} type="button">×</button>}<kbd>/</kbd></div>
                <select aria-label={t('browser.filterLabel')} onChange={(event) => setGroup(event.target.value)} value={group}>
                    <option value="all">{t('browser.allGroups')}</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <div className="view-menu"><button className="tool-button" onClick={() => setShowColumns((value) => !value)}>{t('browser.view')} <span>▾</span></button>{showColumns && <div className="column-menu">{(Object.keys(columnLabels) as Column[]).map((column) => <label key={column}><input checked={columns.includes(column)} onChange={() => toggleColumn(column)} type="checkbox" />{columnLabels[column]}</label>)}</div>}</div>
            </div>

            <div className="explorer-actions"><span><strong>{filteredCommands.length.toLocaleString()}</strong> {t('browser.results')} {selected.size ? ` / ${selected.size} ${t('browser.selected')}` : ""}</span><Link className="export-button" href={`/games/${gameSlug}/export`}>{t('browser.openExport')} <span>↗</span></Link></div>

            <div className="explorer-layout">
                <div className="command-table">
                    <div className="table-header"><label><input checked={filteredCommands.length > 0 && filteredCommands.every((command) => selected.has(command.name))} onChange={toggleAllVisible} type="checkbox" /></label>{columns.map((column) => <span key={column}>{columnLabels[column]}</span>)}</div>
                    {groupedCommands.map(([namespace, namespaceCommands]) => <section className="namespace-section" key={namespace}><div className="namespace-heading"><span className="namespace-icon">{namespace.slice(0, 1)}</span><h2>{namespace}</h2><span>{namespaceCommands.length} {t('browser.functions')}</span></div>{namespaceCommands.map((command) => <button className={`table-row ${activeCommand?.name === command.name ? "is-active" : ""}`} key={command.name} onClick={() => { setActiveName(command.name); setIsInspectorOpen(true); }}><label onClick={(event) => event.stopPropagation()}><input checked={selected.has(command.name)} onChange={() => toggleSelected(command.name)} type="checkbox" /></label>{columns.map((column) => <span className={`cell-${column}`} key={column}>{columnValue(command, column)}</span>)}</button>)}</section>)}
                    {!filteredCommands.length && <p className="command-empty">{t('browser.noResults')}</p>}
                </div>

                {isInspectorOpen && activeCommand && <div className="inspector-modal" role="dialog" aria-modal="true" aria-labelledby="inspector-title"><button aria-label={t('common.close')} className="inspector-backdrop" onClick={() => setIsInspectorOpen(false)} /><div className="inspector"><div className="inspector-label">{t('browser.inspector')} <button aria-label={t('common.close')} onClick={() => setIsInspectorOpen(false)}>{t('browser.escape')}</button></div><div className="inspector-heading"></div><h2 id="inspector-title">{activeCommand.name}</h2><code className="inspector-signature">{activeCommand.syntax}</code><div className="inspector-grid"><span>{t('browser.namespace')}<strong>{activeCommand.namespace ?? "GLOBAL"}</strong></span><span>{t('browser.returns')}<strong>{activeCommand.returnType ?? "UNKNOWN"}</strong></span><span>{t('browser.hash')}<strong>{activeCommand.hash ?? "N/A"}</strong></span><span>{t('browser.build')}<strong>{activeCommand.build ?? "ALL"}</strong></span></div><div className="inspector-section"><span>{t('browser.parameters')}</span>{activeCommand.params?.length ? activeCommand.params.map((param) => <div className="param" key={param.name}><code>{param.name}</code><span>{param.type}</span></div>) : <p>{t('browser.noParams')}</p>}</div>{activeCommand.comment && <div className="inspector-section"><span>{t('browser.documentation')}</span><p>{activeCommand.comment}</p></div>}</div></div>}
            </div>
        </section>
    );
}

function invokeSignature(command: Command) {
    const hash = command.hash ?? "HASH";
    const returnType = command.returnType ?? "void";
    const args = command.params?.map((param) => param.name).join(", ") ?? "";
    return `Invoke<${hash}, ${returnType}>(${args})`;
}