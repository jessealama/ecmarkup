import type Spec from './Spec';
import type Clause from './Clause';
import type { Context } from './Context';
import Builder from './Builder';
export default class Note extends Builder {
    static readonly elements: readonly ["EMU-NOTE"];
    constructor(spec: Spec, node: HTMLElement, clause: Clause);
    static enter({ spec, node, clauseStack }: Context): Promise<void>;
    build(number?: number): void;
}
//# sourceMappingURL=Note.d.ts.map