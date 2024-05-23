import type Clause from './Clause';
import type { Spec } from './ecmarkup';
export interface ClauseNumberIterator {
    next(clauseStack: Clause[], node: HTMLElement): string;
}
export default function iterator(spec: Spec): ClauseNumberIterator;
//# sourceMappingURL=clauseNums.d.ts.map