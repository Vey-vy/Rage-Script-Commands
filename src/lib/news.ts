import 'server-only';

import { createHash } from 'node:crypto';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export interface NewsAnnouncement {
  key: string;
  title: string;
  description?: string;
  link?: string;
  category?: string;
  image?: string;
  changes?: string[];
  markdown?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('News API XML contains an invalid news entry.');
  }

  return value as Record<string, unknown>;
}

function readText(record: Record<string, unknown>, field: string): string {
  const value = record[field];

  if (value === undefined) return '';
  if (typeof value !== 'string') {
    throw new Error(`News API XML field "${field}" must contain text.`);
  }

  return value;
}

function parseNewsEntry(value: unknown): Omit<NewsAnnouncement, 'key'> {
  const entry = asRecord(value);
  const changesContainer = entry.changes;
  const rawChanges = changesContainer === undefined
    ? undefined
    : asRecord(changesContainer).change;
  const changes = rawChanges === undefined
    ? []
    : Array.isArray(rawChanges) ? rawChanges : [rawChanges];

  if (!changes.every((change) => typeof change === 'string')) {
    throw new Error('News API XML contains a change that is not text.');
  }

  return {
    title: readText(entry, 'title'),
    description: readText(entry, 'description'),
    link: readText(entry, 'link'),
    category: readText(entry, 'category'),
    image: readText(entry, 'image'),
    changes,
    markdown: readText(entry, 'markdown'),
  };
}

export async function getLatestNews(): Promise<NewsAnnouncement | null> {
  const apiUrl = process.env.API;
  const apiKey = process.env.API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error('News API requires the server-side API and API_KEY environment variables.');
  }

  const endpoint = `${apiUrl.replace(/\/+$/, '')}/rage/news`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/xml, text/xml',
      'x-api-key': apiKey,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`News API returned HTTP ${response.status} ${response.statusText}.`);
  }

  const xml = await response.text();
  const validation = XMLValidator.validate(xml);

  if (validation !== true) {
    throw new Error(`News API returned invalid XML: ${validation.err.msg} at line ${validation.err.line}, column ${validation.err.col}.`);
  }

  const parsed: unknown = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: false,
  }).parse(xml);
  const document = asRecord(parsed);
  const root = document.rage_news;

  if (root === '') return null;
  if (root === undefined) {
    throw new Error('News API XML is missing the <rage_news> root element.');
  }

  const newsRoot = asRecord(root);
  const entries = newsRoot.news === undefined
    ? []
    : Array.isArray(newsRoot.news) ? newsRoot.news : [newsRoot.news];
  const latest = entries.at(-1);

  if (latest === undefined) return null;

  const announcement = parseNewsEntry(latest);

  return {
    ...announcement,
    key: createHash('sha256').update(JSON.stringify(announcement)).digest('hex'),
  };
}
