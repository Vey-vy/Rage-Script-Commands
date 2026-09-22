import {XMLParser} from 'fast-xml-parser';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {cache} from 'react';
import type {Command, Game, JsonNative, RageTitlesXml, XmlTitle} from '@/types';

const CACHE_TTL = 1000 * 60 * 60;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const fetchCache = new Map<string, CacheEntry<unknown>>();

function normalizeJsonCommands(value: unknown, namespace?: string): Command[] {
  const commands: Command[] = [];

  if (!value || typeof value !== 'object') return commands;

  for (const [key, native] of Object.entries(
           value as Record<string, unknown>)) {
    if (native && typeof native === 'object' && 'name' in native) {
      const entry = native as JsonNative;
      if (!entry.name) continue;

      const params =
          (entry.params ?? []).map((param, index) => ({
                                     name: param.name ?? `arg${index + 1}`,
                                     type: param.type ?? 'any',
                                   }));

      commands.push({
        name: entry.name,
        syntax: `${entry.name}(${
            params.map((param) => `${param.type} ${param.name}`).join(', ')})`,
        namespace,
        sourceType: 'json',
        hash: key,
        returnType: entry.return_type,
        params,
        comment: entry.comment,
        build: entry.build,
      });
      continue;
    }

    commands.push(...normalizeJsonCommands(native, key));
  }

  return commands;
}

function normalizeHeaderCommands(source: string): Command[] {
  const commands: Command[] = [];
  const seen = new Set<string>();
  const declaration =
      /(?:\/\/\s*.*?\|\s*(0x[0-9A-Fa-f]+)\s*\r?\n\s*)?(?:static\s+)?([A-Za-z_][A-Za-z0-9_:<>\[\]&*\s]*)\s+([A-Z][A-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
  const namespaceBlock = /namespace\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g;

  const ranges: Array<{name: string | null; start: number; end: number}> = [];
  let namespaceMatch: RegExpExecArray|null;

  while ((namespaceMatch = namespaceBlock.exec(source)) !== null) {
    const name = namespaceMatch[1];
    const start = namespaceMatch.index + namespaceMatch[0].length;
    let depth = 1;
    let cursor = start;

    while (cursor < source.length && depth > 0) {
      const char = source[cursor];
      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;
      cursor += 1;
    }

    ranges.push({name, start, end: cursor});
  }

  const blocks =
      ranges.length ? ranges : [{name: null, start: 0, end: source.length}];

  for (const block of blocks) {
    const blockSource = source.slice(block.start, block.end);
    for (const match of blockSource.matchAll(declaration)) {
      const hash = match[1] ?? undefined;
      const returnType = match[2]?.trim() || undefined;
      const name = match[3];
      const args = match[4] ?? '';
      const key = `${block.name ?? 'GLOBAL'}:${name}`;
      if (seen.has(key)) continue;

      seen.add(key);
      commands.push({
        name,
        syntax: `${name}(${args.replace(/\s+/g, ' ').trim()})`,
        namespace: block.name ?? undefined,
        sourceType: 'header',
        hash,
        returnType,
        params: args ? args.split(',').map((part, index) => {
          const trimmed = part.trim();
          const matchName = trimmed.match(
              /(?:\w+:?\s*)?(?:\*+|\w+\s+)?([A-Za-z_][A-Za-z0-9_]*)$/);
          const namePart = matchName?.[1] ?? `arg${index + 1}`;
          const typePart =
              trimmed.replace(new RegExp(`\\b${namePart}$`), '').trim();
          return {name: namePart, type: typePart || 'any'};
        }) :
                       [],
      });
    }
  }

  return commands;
}

function normalizeImages(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === 'string') {
    return value.split(/[\n,|]+/).map((entry) => entry.trim()).filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeImages(entry));
  }

  if (typeof value === 'object') {
    const values = Object.values(value as Record<string, unknown>);
    const images = values.flatMap((entry) => normalizeImages(entry));
    return [...new Set(images)];
  }

  return [];
}

async function fetchWithCache<T>(
    url: string, parser: (text: string) => T): Promise<T> {
  const cached = fetchCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const response = await fetch(url, {cache: 'no-store'});
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const text = await response.text();
  const data = parser(text);
  fetchCache.set(url, {data, timestamp: Date.now()});
  return data;
}

async function fetchCommands(url: string): Promise<Command[]> {
  if (!url) return [];

  try {
    if (url.endsWith('.json')) {
      return fetchWithCache(
          url, (text) => normalizeJsonCommands(JSON.parse(text)));
    }

    return fetchWithCache(url, normalizeHeaderCommands);
  } catch {
    return [];
  }
}

const readCatalog = cache(async(): Promise<Game[]> => {
  const xml =
      await readFile(path.join(process.cwd(), 'rage_title.xml'), 'utf8');
  const parsed = new XMLParser().parse(xml) as RageTitlesXml;
  const titles = parsed.rage_titles?.title ?? [];
  const titleList = Array.isArray(titles) ? titles : [titles];

  const games = await Promise.all(titleList.map(async (title: XmlTitle) => {
    const localCommands = title.commands?.command ?? [];
    const fetchedCommands = await fetchCommands(title.source_url);
    const fallbackCommands = (Array.isArray(localCommands) ? localCommands : [
                               localCommands
                             ]).filter(Boolean);
    const images = normalizeImages(title.images);

    return {
      slug: title.slug,
      title: title.display_name,
      platform: title.platform,
      engine: title.engine,
      description: title.description,
      commandCount: fetchedCommands.length || fallbackCommands.length,
      accent: title.accent,
      images,
      commands: fetchedCommands.length ? fetchedCommands : fallbackCommands,
    } satisfies Game;
  }));

  return games.filter(Boolean);
});

export const getGames = cache(async(): Promise<Game[]> => readCatalog());

export const getGame = cache(async(slug: string): Promise<Game|undefined> => {
  const games = await readCatalog();
  return games.find((game) => game.slug === slug);
});