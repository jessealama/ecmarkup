import type { FragmentNode } from 'ecmarkdown';
type SimpleLocation = {
    start: {
        offset: number;
    };
    end: {
        offset: number;
    };
};
type BareText = {
    name: 'text';
    contents: string;
    location: {
        start: {
            offset: number;
        };
        end: {
            offset: number;
        };
    };
};
type ProsePart = FragmentNode | BareText;
type List = {
    name: 'list';
    elements: Seq[];
    location: SimpleLocation;
};
type Record = {
    name: 'record';
    members: {
        name: string;
        value: Seq;
    }[];
    location: SimpleLocation;
};
type RecordSpec = {
    name: 'record-spec';
    members: {
        name: string;
    }[];
    location: SimpleLocation;
};
type Call = {
    name: 'call';
    callee: ProsePart[];
    arguments: Seq[];
    location: SimpleLocation;
};
type SDOCall = {
    name: 'sdo-call';
    callee: [BareText];
    parseNode: Seq;
    arguments: Seq[];
    location: SimpleLocation;
};
type Paren = {
    name: 'paren';
    items: NonSeq[];
    location: SimpleLocation;
};
type Figure = {
    name: 'figure';
    location: SimpleLocation;
};
export type Seq = {
    name: 'seq';
    items: NonSeq[];
};
export type NonSeq = ProsePart | List | Record | RecordSpec | Call | SDOCall | Paren | Figure;
export type Expr = NonSeq | Seq;
type Failure = {
    name: 'failure';
    message: string;
    offset: number;
};
type TokenType = 'eof' | 'olist' | 'clist' | 'orec' | 'crec' | 'oparen' | 'cparen' | 'and' | 'is' | 'comma' | 'period' | 'x_of' | 'with_args' | 'figure';
type SimpleToken = {
    name: TokenType;
    offset: number;
    source: string;
};
type Token = ProsePart | SimpleToken;
export declare function isProsePart(tok: NonSeq | Token | undefined): tok is ProsePart;
export declare function parse(src: FragmentNode[], opNames: Set<String>): Seq | Failure;
export type PathItem = {
    parent: List | Record | Seq | Paren;
    index: number;
} | {
    parent: Call;
    index: number;
} | {
    parent: SDOCall;
    index: number;
};
export declare function walk(f: (expr: Expr, path: PathItem[]) => void, current: Expr, path?: PathItem[]): void;
export {};
//# sourceMappingURL=expr-parser.d.ts.map