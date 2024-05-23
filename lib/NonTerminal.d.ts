import type Spec from './Spec';
import type { Context } from './Context';
import Builder from './Builder';
export default class NonTerminal extends Builder {
    static readonly elements: readonly ["EMU-NT"];
    constructor(spec: Spec, node: HTMLElement, namespace: string);
    static enter({ spec, node, clauseStack }: Context): Promise<void>;
    build(): void;
}
//# sourceMappingURL=NonTerminal.d.ts.map