import type Spec from './Spec';
import type { Expr } from './expr-parser';
import type Biblio from './Biblio';
export declare function typecheck(spec: Spec): void;
type Type = {
    kind: 'unknown';
} | {
    kind: 'never';
} | {
    kind: 'union';
    of: NonUnion[];
} | {
    kind: 'list';
    of: Type;
} | {
    kind: 'record';
} | {
    kind: 'completion';
    of: Type;
} | {
    kind: 'real';
} | {
    kind: 'integer';
} | {
    kind: 'non-negative integer';
} | {
    kind: 'negative integer';
} | {
    kind: 'positive integer';
} | {
    kind: 'concrete real';
    value: string;
} | {
    kind: 'ES value';
} | {
    kind: 'string';
} | {
    kind: 'number';
} | {
    kind: 'integral number';
} | {
    kind: 'bigint';
} | {
    kind: 'boolean';
} | {
    kind: 'null';
} | {
    kind: 'undefined';
} | {
    kind: 'concrete string';
    value: string;
} | {
    kind: 'concrete number';
    value: number;
} | {
    kind: 'concrete bigint';
    value: bigint;
} | {
    kind: 'concrete boolean';
    value: boolean;
} | {
    kind: 'enum value';
    value: string;
};
type NonUnion = Exclude<Type, {
    kind: 'union';
}>;
export declare function join(a: Type, b: Type): Type;
export declare function meet(a: Type, b: Type): Type;
export declare function typeFromExpr(expr: Expr, biblio: Biblio): Type;
export {};
//# sourceMappingURL=typechecker.d.ts.map