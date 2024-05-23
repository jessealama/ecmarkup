import type { OrderedListNode, OrderedListItemNode } from 'ecmarkdown';
import type { Reporter } from '../algorithm-error-reporter-type';
import type { Seq } from '../../expr-parser';
export declare function checkVariableUsage(algorithmSource: string, containingAlgorithm: Element, steps: OrderedListNode, parsed: Map<OrderedListItemNode, Seq>, report: Reporter): void;
//# sourceMappingURL=variable-use-def.d.ts.map