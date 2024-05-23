type Entries = {
    op?: AlgorithmBiblioEntry[];
    production?: ProductionBiblioEntry[];
    clause?: ClauseBiblioEntry[];
    term?: TermBiblioEntry[];
    table?: FigureBiblioEntry[];
    figure?: FigureBiblioEntry[];
    example?: FigureBiblioEntry[];
    note?: FigureBiblioEntry[];
    step?: StepBiblioEntry[];
};
declare class EnvRec {
    entries: Array<BiblioEntry>;
    _parent: EnvRec | undefined;
    _namespace: string;
    _children: EnvRec[];
    _byType: Entries;
    _byLocation: {
        [key: string]: BiblioEntry[];
    };
    _byProductionName: {
        [key: string]: ProductionBiblioEntry;
    };
    _byAoid: {
        [key: string]: AlgorithmBiblioEntry;
    };
    _keys: Set<String>;
    constructor(parent: EnvRec | undefined, namespace: string);
    push(...items: BiblioEntry[]): number;
}
export default class Biblio {
    private _byId;
    private _location;
    private _root;
    private _nsToEnvRec;
    constructor(location: string);
    byId(id: string): BiblioEntry;
    byNamespace(ns: string): EnvRec;
    byProductionName(name: string, ns?: string): ProductionBiblioEntry | undefined;
    byAoid(aoid: string, ns?: string): AlgorithmBiblioEntry | undefined;
    getOpNames(ns: string): Set<string>;
    getDefinedWords(ns: string): Record<string, AlgorithmBiblioEntry | TermBiblioEntry>;
    private lookup;
    keysForNamespace(ns: string): Set<String>;
    localEntries(): BiblioEntry[];
    export(): ExportedBiblio;
    dump(): void;
}
export interface BiblioEntryBase {
    type: string;
    location: string;
    namespace?: string;
    id?: string;
    refId?: string;
    aoid?: string | null;
    referencingIds: string[];
}
export type Type = {
    kind: 'opaque';
    type: string;
} | {
    kind: 'unused';
} | {
    kind: 'completion';
    completionType: 'abrupt';
} | {
    kind: 'completion';
    typeOfValueIfNormal: Type | null;
    completionType: 'normal' | 'mixed';
} | {
    kind: 'list';
    elements: Type | null;
} | {
    kind: 'union';
    types: Exclude<Type, {
        kind: 'union';
    }>[];
} | {
    kind: 'record';
    fields: Record<string, Type | null>;
};
export type Parameter = {
    name: string;
    type: null | Type;
};
export type Signature = {
    parameters: Parameter[];
    optionalParameters: Parameter[];
    return: null | Type;
};
export type AlgorithmType = 'abstract operation' | 'host-defined abstract operation' | 'implementation-defined abstract operation' | 'syntax-directed operation' | 'numeric method';
export interface AlgorithmBiblioEntry extends BiblioEntryBase {
    type: 'op';
    aoid: string;
    kind?: AlgorithmType;
    signature: null | Signature;
    effects: string[];
    skipGlobalChecks?: boolean;
}
export interface ProductionBiblioEntry extends BiblioEntryBase {
    type: 'production';
    name: string;
}
export interface ClauseBiblioEntry extends BiblioEntryBase {
    type: 'clause';
    id: string;
    aoid: string | null;
    title: string;
    titleHTML: string;
    number: string | number;
}
export interface TermBiblioEntry extends BiblioEntryBase {
    type: 'term';
    term: string;
    variants?: string[];
}
export interface FigureBiblioEntry extends BiblioEntryBase {
    type: 'table' | 'figure' | 'example' | 'note';
    id: string;
    number: string | number;
    clauseId?: string;
    caption?: string;
}
export interface StepBiblioEntry extends BiblioEntryBase {
    type: 'step';
    id: string;
    stepNumbers: number[];
}
export type BiblioEntry = AlgorithmBiblioEntry | ProductionBiblioEntry | ClauseBiblioEntry | TermBiblioEntry | FigureBiblioEntry | StepBiblioEntry;
type Unkey<T, S extends string> = T extends any ? Omit<T, S> : never;
type NonExportedKeys = 'location' | 'referencingIds' | 'namespace';
export type PartialBiblioEntry = Unkey<BiblioEntry, NonExportedKeys>;
export type ExportedBiblio = {
    location: string;
    entries: PartialBiblioEntry[];
};
export declare function getKeys(entry: TermBiblioEntry): string[];
export {};
//# sourceMappingURL=Biblio.d.ts.map