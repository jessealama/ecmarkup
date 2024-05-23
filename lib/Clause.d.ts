import type Spec from './Spec';
import type { Context } from './Context';
import Builder from './Builder';
export declare const SPECIAL_KINDS_MAP: Map<string, string>;
export declare const SPECIAL_KINDS: string[];
export declare function extractStructuredHeader(header: Element): Element | null;
export default class Clause extends Builder {
    constructor(spec: Spec, node: HTMLElement, parent: Clause, number: string);
    canHaveEffect(effectName: string): boolean;
    static enter({ spec, node, clauseStack, clauseNumberer }: Context): Promise<void>;
    static exit({ node, spec, clauseStack, inAlg, currentId }: Context): void;
    static elements: string[];
    static linkElements: string[];
}
//# sourceMappingURL=Clause.d.ts.map