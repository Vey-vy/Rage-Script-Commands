import { Fragment } from 'react';

type TokenKind = 'number' | 'string' | 'keyword' | 'type' | 'function' | 'punct' | 'text';

interface Token {
    kind: TokenKind;
    value: string;
}

const KEYWORDS = ['const', 'void', 'bool', 'int', 'float', 'double', 'char', 'long', 'unsigned', 'uint'];
const TYPES = [
    'BOOL',
    'Any',
    'Hash',
    'Object',
    'Entity',
    'Ped',
    'Vehicle',
    'Player',
    'Vector3',
    'Cam',
    'Blip',
    'Interior',
    'ScrHandle',
];

const TOKEN_REGEX = new RegExp(
    [
        /(0x[0-9a-fA-F]+)/.source, // 1: hex number
        /(\b\d+\.?\d*\b)/.source, // 2: decimal number
        /("(?:[^"\\]|\\.)*")/.source, // 3: string
        `(\\b(?:${KEYWORDS.join('|')})\\b)`, // 4: keyword
        `(\\b(?:${TYPES.join('|')})\\b)`, // 5: builtin type
        /(\b(?:Invoke|[A-Z][A-Z0-9_]{2,})\b(?=\s*[(<]))/.source, // 6: function name
        /([<>(),*&:])/.source, // 7: punctuation
    ].join('|'),
    'g'
);

function tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    TOKEN_REGEX.lastIndex = 0;
    while ((match = TOKEN_REGEX.exec(code))) {
        if (match.index > lastIndex) {
            tokens.push({ kind: 'text', value: code.slice(lastIndex, match.index) });
        }

        const [, hex, number, string, keyword, type, fn, punct] = match;
        if (hex || number) tokens.push({ kind: 'number', value: match[0] });
        else if (string) tokens.push({ kind: 'string', value: match[0] });
        else if (keyword) tokens.push({ kind: 'keyword', value: match[0] });
        else if (type) tokens.push({ kind: 'type', value: match[0] });
        else if (fn) tokens.push({ kind: 'function', value: match[0] });
        else if (punct) tokens.push({ kind: 'punct', value: match[0] });

        lastIndex = TOKEN_REGEX.lastIndex;
    }

    if (lastIndex < code.length) {
        tokens.push({ kind: 'text', value: code.slice(lastIndex) });
    }

    return tokens;
}

export function NativeCode({ code }: { code: string }) {
    const tokens = tokenize(code);
    return (
        <code className="native-code">
            {tokens.map((token, index) => (
                <Fragment key={index}>
                    {token.kind === 'text' ? token.value : <span className={`tok-${token.kind}`}>{token.value}</span>}
                </Fragment>
            ))}
        </code>
    );
}