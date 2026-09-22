import { Fragment } from 'react';

type Language = 'json' | 'cpp';
type TokenKind = 'comment' | 'string' | 'number' | 'keyword' | 'type' | 'function' | 'punct' | 'text';

interface Token {
    kind: TokenKind;
    value: string;
}

const CPP_KEYWORDS = ['static', 'const', 'void', 'bool', 'int', 'float', 'double', 'char', 'long', 'unsigned', 'uint'];
const CPP_TYPES = [
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
    'Request_s',
];

function runTokenizer(code: string, regex: RegExp, classify: (match: RegExpExecArray) => TokenKind): Token[] {
    const tokens: Token[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    regex.lastIndex = 0;
    while ((match = regex.exec(code))) {
        if (match.index > lastIndex) {
            tokens.push({ kind: 'text', value: code.slice(lastIndex, match.index) });
        }
        tokens.push({ kind: classify(match), value: match[0] });
        lastIndex = regex.lastIndex;
        if (match[0].length === 0) regex.lastIndex += 1;
    }

    if (lastIndex < code.length) {
        tokens.push({ kind: 'text', value: code.slice(lastIndex) });
    }

    return tokens;
}

function tokenizeJson(code: string): Token[] {
    const regex = /("(?:[^"\\]|\\.)*")|(-?\b\d+\.?\d*\b)|(\btrue\b|\bfalse\b|\bnull\b)|([{}[\]:,])/g;
    return runTokenizer(code, regex, (match) => {
        const [, string, number, keyword, punct] = match;
        if (string) return 'string';
        if (number) return 'number';
        if (keyword) return 'keyword';
        if (punct) return 'punct';
        return 'text';
    });
}

function tokenizeCpp(code: string): Token[] {
    const regex = new RegExp(
        [
            '(//[^\\n]*)', // 1: line comment
            '(#pragma\\b)', // 2: preprocessor directive
            '(0x[0-9a-fA-F]+)', // 3: hex number
            '(\\b\\d+\\.?\\d*\\b)', // 4: decimal number
            '("(?:[^"\\\\]|\\\\.)*")', // 5: string
            `(\\b(?:${CPP_KEYWORDS.join('|')})\\b)`, // 6: keyword
            `(\\b(?:${CPP_TYPES.join('|')})\\b)`, // 7: builtin type
            '(\\b[A-Za-z_][A-Za-z0-9_]*\\b(?=\\s*[(;]))', // 8: function-ish identifier
            '([{}()<>,;*&:])', // 9: punctuation
        ].join('|'),
        'g'
    );

    return runTokenizer(code, regex, (match) => {
        const [, comment, pragma, hex, number, string, keyword, type, fn, punct] = match;
        if (comment) return 'comment';
        if (pragma) return 'keyword';
        if (hex || number) return 'number';
        if (string) return 'string';
        if (keyword) return 'keyword';
        if (type) return 'type';
        if (fn) return 'function';
        if (punct) return 'punct';
        return 'text';
    });
}

export function CodeBlock({ code, language }: { code: string; language: Language }) {
    const tokens = language === 'json' ? tokenizeJson(code) : tokenizeCpp(code);
    return (
        <pre className="export-code">
            <code>
                {tokens.map((token, index) => (
                    <Fragment key={index}>
                        {token.kind === 'text' ? token.value : <span className={`tok-${token.kind}`}>{token.value}</span>}
                    </Fragment>
                ))}
            </code>
        </pre>
    );
}