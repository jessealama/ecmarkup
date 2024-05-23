import type Spec from './Spec';
import type Clause from './Clause';
import type { Context } from './Context';
import Builder from './Builder';
export default class Example extends Builder {
    static readonly elements: readonly ["EMU-EXAMPLE"];
    constructor(spec: Spec, node: HTMLElement, clause: Clause);
    static enter({ spec, node, clauseStack }: Context): Promise<void>;
    build(number?: number): void;
}
//# sourceMappingURL=Example.d.ts.map