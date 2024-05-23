import type { ElementLocation } from 'parse5';
import type Spec from './Spec';
export declare function warnEmdFailure(report: Spec['warn'], node: Element | Text, e: SyntaxError & {
    line?: number;
    column?: number;
}): void;
export declare function wrapEmdFailure(src: string): string;
export declare function offsetToLineAndColumn(string: string, offset: number): {
    line: number;
    column: number;
};
export declare function attrLocation(source: string | undefined, loc: ElementLocation, attr: string): {
    line: number;
    column: number;
};
export declare function attrValueLocation(source: string | undefined, loc: ElementLocation, attr: string): {
    line: number;
    column: number;
};
export declare function validateEffects(spec: Spec, effectsRaw: string[], node: Element): string[];
export declare function doesEffectPropagateToParent(node: Element, effect: string): boolean;
export declare function zip<A, B>(as: Iterable<A>, bs: Iterable<B>, allowMismatchedLengths?: boolean): Iterable<[A, B]>;
//# sourceMappingURL=utils.d.ts.map