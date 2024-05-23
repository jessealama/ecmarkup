import type { Context } from './Context';
import type Spec from './Spec';
import Builder from './Builder';
export default class ProdRef extends Builder {
    static readonly elements: readonly ["EMU-PRODREF"];
    constructor(spec: Spec, node: HTMLElement, namespace: string);
    static enter({ node, spec, clauseStack }: Context): Promise<void>;
    build(): void;
}
//# sourceMappingURL=ProdRef.d.ts.map