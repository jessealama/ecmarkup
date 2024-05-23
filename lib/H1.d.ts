import Builder from './Builder';
import type { Context } from './Context';
export default class H1 extends Builder {
    static elements: string[];
    static enter(): Promise<void>;
    static exit({ spec, node, clauseStack }: Context): Promise<void>;
}
//# sourceMappingURL=H1.d.ts.map