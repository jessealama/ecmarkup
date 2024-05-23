import type Spec from './Spec';
import type { Context } from './Context';
import Builder from './Builder';
export default class Meta extends Builder {
    static elements: string[];
    static enter({ spec, node, clauseStack }: Context): Promise<void>;
    static render(spec: Spec, node: HTMLElement): void;
}
//# sourceMappingURL=Meta.d.ts.map