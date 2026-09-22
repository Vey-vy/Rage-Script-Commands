export interface CommandParam {
  name: string;
  type: string;
}

export interface Command {
  name: string;
  syntax: string;
  namespace?: string;
  sourceType?: 'json' | 'header';
  hash?: string;
  returnType?: string;
  params?: CommandParam[];
  comment?: string;
  build?: string;
}

export interface Game {
  slug: string;
  title: string;
  platform: string;
  engine: string;
  description?: string;
  commandCount: number;
  accent?: string;
  images?: string[];
  commands: Command[];
}

export interface XmlCommand {
  name: string;
  syntax: string;
}

export interface XmlTitle {
  slug: string;
  display_name: string;
  platform: string;
  engine: string;
  source_url: string;
  description?: string;
  accent?: string;
  images?: unknown;
  commands?: {command?: XmlCommand|XmlCommand[]};
}

export interface JsonNative {
  name?: string;
  params?: {name?: string; type?: string}[];
  return_type?: string;
  comment?: string;
  build?: string;
}

export interface RageTitlesXml {
  rage_titles?: {title?: XmlTitle|XmlTitle[]};
}