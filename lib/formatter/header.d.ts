import type { ParsedHeaderOrFailure } from '../header-parser';
import { LineBuilder } from './line-builder';
export declare function printHeader(parseResult: ParsedHeaderOrFailure & {
    type: 'single-line' | 'multi-line';
}, clauseType: string | null, indent: number): LineBuilder;
//# sourceMappingURL=header.d.ts.map