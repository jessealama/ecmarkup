import type Spec from './Spec';
import type Clause from './Clause';
import type Biblio from './Biblio';
import type { BiblioEntry } from './Biblio';
export declare const NO_CLAUSE_AUTOLINK: Set<string>;
export declare const YES_CLAUSE_AUTOLINK: Set<string>;
export declare function autolink(node: Node, replacer: RegExp, autolinkmap: AutoLinkMap, clause: Clause | Spec, currentId: string | null, allowSameId: boolean): void;
export declare function replacerForNamespace(namespace: string, biblio: Biblio): {
    replacer: RegExp;
    autolinkmap: AutoLinkMap;
};
export interface AutoLinkMap {
    [key: string]: BiblioEntry;
}
//# sourceMappingURL=autolinker.d.ts.map