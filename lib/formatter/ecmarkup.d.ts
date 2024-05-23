import type { Element } from 'parse5';
import { LineBuilder } from './line-builder';
export declare const VOID_ELEMENTS: Set<string>;
export declare function printDocument(src: string): Promise<string>;
export declare function printElement(src: string, node: Element, indent: number): Promise<LineBuilder>;
export declare function printStartTag(tag: Element): string;
//# sourceMappingURL=ecmarkup.d.ts.map