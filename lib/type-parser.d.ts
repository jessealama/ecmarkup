import type { Type } from './Biblio';
export declare class ParseError extends Error {
    offset: number;
    constructor(message: string, offset: number);
}
export declare class TypeParser {
    offset: number;
    allowParensInOpaque: boolean;
    input: string;
    remainder: string;
    constructor(input: string);
    static parse(input: string): Type;
    parse(): Type;
    private parseTypePossiblyWithUnmarkedUnion;
    private parseType;
    eatWs(): void;
    eat(regexp: RegExp): RegExpMatchArray | null;
    eatUntil(regexp: RegExp): string;
    expect(regexp: RegExp): RegExpMatchArray;
}
//# sourceMappingURL=type-parser.d.ts.map