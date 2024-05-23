import type Spec from './Spec';
import type Clause from './Clause';
export default class Toc {
    constructor(spec: Spec);
    static build(level: Spec | Clause, { maxDepth, expandy }?: {
        maxDepth?: number | undefined;
        expandy?: boolean | undefined;
    }): string;
}
//# sourceMappingURL=Toc.d.ts.map