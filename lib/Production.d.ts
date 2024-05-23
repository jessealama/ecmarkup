import type Spec from './Spec';
import type { Context } from './Context';
import Builder from './Builder';
export default class Production extends Builder {
    constructor(spec: Spec, node: HTMLElement, namespace: string);
    private _id;
    static enter({ spec, node, clauseStack }: Context): Promise<void>;
    static readonly elements: readonly ["EMU-PRODUCTION"];
}
//# sourceMappingURL=Production.d.ts.map