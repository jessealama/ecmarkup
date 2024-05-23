import type Spec from './Spec';
import type { Context } from './Context';
export type BuilderInterface = Omit<typeof Builder, never>;
export default class Builder {
    spec: Spec;
    node: HTMLElement;
    constructor(spec: Spec, node: HTMLElement);
    static enter(context: Context): Promise<void>;
    static exit(context: Context): void;
    static readonly elements: readonly string[];
}
//# sourceMappingURL=Builder.d.ts.map