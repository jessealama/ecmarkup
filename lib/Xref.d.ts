import type Spec from './Spec';
import type { Context } from './Context';
import type Clause from './Clause';
import Builder from './Builder';
export default class Xref extends Builder {
    static readonly elements: readonly ["EMU-XREF"];
    constructor(spec: Spec, node: HTMLElement, clause: Clause | null, namespace: string, href: string, aoid: string);
    shouldPropagateEffect(effectName: string): boolean;
    hasAddedEffect(effectName: string): boolean;
    static enter({ node, spec, clauseStack }: Context): Promise<void>;
}
//# sourceMappingURL=Xref.d.ts.map