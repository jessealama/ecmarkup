import type { OptionDefinition } from 'command-line-usage';
export declare function parse<T extends readonly OptionDefinition[]>(options: T, printHelp: () => void): ArgsFromOptions<T>;
type Multiples<T> = T extends unknown ? Extract<T, {
    multiple: true;
} | {
    lazyMultiple: true;
}> : never;
type Defaulted<T> = T extends unknown ? Extract<T, {
    defaultValue: unknown;
}> : never;
type Optional<T> = T extends unknown ? Exclude<T, Multiples<T> | Defaulted<T>> : never;
type ReturnTypeOrNull<T> = T extends (...args: unknown[]) => unknown ? ReturnType<T> : null;
type ArgTypeForKey<T extends readonly OptionDefinition[], key extends string> = ReturnTypeOrNull<Extract<T[number], {
    name: key;
    type?: unknown;
}>['type']>;
type OptionalPropertyNames<T> = {
    [K in keyof T]-?: {} extends {
        [P in K]: T[K];
    } ? K : never;
}[keyof T];
type SpreadProperties<L, R, K extends keyof L & keyof R> = {
    [P in K]: L[P] | Exclude<R[P], undefined>;
};
type Id<T> = T extends infer U ? {
    [K in keyof U]: U[K];
} : never;
type SpreadTwo<L, R> = Id<Pick<L, Exclude<keyof L, keyof R>> & Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> & Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> & SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>>;
type Spread<A extends readonly unknown[]> = A extends [infer L, ...infer R] ? SpreadTwo<L, Spread<R>> : unknown;
type ArgsFromOptions<T extends readonly OptionDefinition[]> = Spread<[
    {
        [key in Multiples<T[number]>['name']]: ArgTypeForKey<T, key>[];
    },
    {
        [key in Defaulted<T[number]>['name']]: ArgTypeForKey<T, key>;
    },
    {
        [key in Optional<T[number]>['name']]?: ArgTypeForKey<T, key>;
    }
]>;
export {};
//# sourceMappingURL=arg-parser.d.ts.map