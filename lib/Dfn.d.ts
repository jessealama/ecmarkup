import type { Context } from './Context';
import Builder from './Builder';
export default class Dfn extends Builder {
    static enter({ spec, node, clauseStack }: Context): Promise<void>;
    static elements: string[];
}
//# sourceMappingURL=Dfn.d.ts.map