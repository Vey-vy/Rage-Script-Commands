import {XMLParser} from 'fast-xml-parser';
import {cache} from 'react';

import type {Command, Game, JsonNative, RageTitlesXml, XmlTitle,} from '@/types';

const CACHE_TTL = 1000 * 60 * 60;

const API_URL = process.env.API;
const API_KEY = process.env.API_KEY;

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
            params.map(param => `${param.type} ${param.name}`).join(', ')})`,
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
      /(?:\/\/\s*.*?\r?\n\s*)?(?:static\s+)?([A-Za-z_][A-Za-z0-9_:<>\[\]&*\s]*)\s+([A-Z][A-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;

  const namespaceBlock = /namespace\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g;

  const ranges: Array<{name: string | null; start: number; end: number;}> = [];

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

    ranges.push({
      name,
      start,
      end: cursor,
    });
  }

  const blocks =
      ranges.length ? ranges : [{name: null, start: 0, end: source.length}];

  for (const block of blocks) {
    const blockSource = source.slice(block.start, block.end);

    for (const match of blockSource.matchAll(declaration)) {
      const returnType = match[1]?.trim() || undefined;
      const name = match[2];
      const args = match[3] ?? '';

      const key = `${block.name ?? 'GLOBAL'}:${name}`;

      if (seen.has(key)) continue;

      seen.add(key);

      commands.push({
        name,
        syntax: `${name}(${args.replace(/\s+/g, ' ').trim()})`,
        namespace: block.name ?? undefined,
        sourceType: 'header',
        returnType,
        params: args ? args.split(',').map((part, index) => {
          const trimmed = part.trim();

          const matchName = trimmed.match(
              /(?:\w+:?\s*)?(?:\*+|\w+\s+)?([A-Za-z_][A-Za-z0-9_]*)$/);

          const namePart = matchName?.[1] ?? `arg${index + 1}`;

          const typePart =
              trimmed.replace(new RegExp(`\\b${namePart}$`), '').trim();

          return {
            name: namePart,
            type: typePart || 'any',
          };
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
    return value.split(/[\n,|]+/).map(entry => entry.trim()).filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.flatMap(entry => normalizeImages(entry));
  }

  if (typeof value === 'object') {
    const values = Object.values(value as Record<string, unknown>);

    const images = values.flatMap(entry => normalizeImages(entry));

    return [...new Set(images)];
  }

  return [];
}

async function fetchWithCache<T>(
    url: string, parser: (text: string) => T): Promise<T> {
  const cached = fetchCache.get(url);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.error(`[FETCH CACHE] HIT ${url}`);
    return cached.data as T;
  }

  console.error(`[FETCH CACHE] START ${url}`);

  const headers: HeadersInit = {
    Accept: 'application/xml, text/xml',
  };

  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  const start = Date.now();

  try {
    console.error(`[FETCH CACHE] REQUEST ${url}`);
    console.error(`[FETCH CACHE] API_URL=${API_URL}`);
    console.error(`[FETCH CACHE] API_KEY=${API_KEY ? 'SET' : 'MISSING'}`);

    const response = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    const duration = Date.now() - start;

    console.error(
        `[FETCH CACHE] RESPONSE ${response.status} ${response.statusText} ${duration}ms ${url}`);

    if (!response.ok) {
      const body = await response.text();

      console.error(
          `[FETCH CACHE] ERROR BODY ${url}: ${body}`);

      throw new Error(
          `Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    console.error(
        `[FETCH CACHE] BODY ${url}: ${text.length} bytes`);

    const data = parser(text);

    fetchCache.set(url, {
      data,
      timestamp: Date.now(),
    });

    console.error(`[FETCH CACHE] SUCCESS ${url}`);

    return data;
  } catch (error) {
    const duration = Date.now() - start;

    console.error(
        `[FETCH CACHE] FAILED ${url} after ${duration}ms`);

    console.error(error);

    throw error;
  }
}

async function fetchCommands(url: string): Promise<Command[]> {
  if (!url) return [];

  try {
    if (url.endsWith('.json')) {
      return fetchWithCache(
          url, text => normalizeJsonCommands(JSON.parse(text)));
    }

    return fetchWithCache(url, normalizeHeaderCommands);
  } catch {
    return [];
  }
}

async function fetchTitles(endpoint: string): Promise<XmlTitle[]> {
  try {
    const url = `${API_URL}${endpoint}`;

    const parsed = await fetchWithCache(
        url,
        text => new XMLParser().parse(text) as RageTitlesXml,
    );

    if (endpoint === '/rage/titles') {
      const titles = parsed.rage_titles?.title ?? [];

      return Array.isArray(titles) ? titles : [titles];
    }

    const projectTitles = (parsed as any).project_titles?.title ?? [];

    return Array.isArray(projectTitles) ? projectTitles : [projectTitles];
  } catch {
    return [];
  }
}

const readCatalog = cache(async(): Promise<Game[]> => {
  const [rageTitles, projectTitles] = await Promise.all([
    fetchTitles('/rage/titles'),
    fetchTitles('/project/titles'),
  ]);

  const titleList = [...rageTitles, ...projectTitles];

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

  return games.find(game => game.slug === slug);
});