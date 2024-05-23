import type { AlgorithmNode } from 'ecmarkdown';
import type { FragmentNode } from 'ecmarkdown/dist/node-types';
import { LineBuilder } from './line-builder';
export declare function printAlgorithm(source: string, alg: AlgorithmNode, indent: number): Promise<LineBuilder>;
export declare function printFragments(source: string, contents: FragmentNode[], indent: number): Promise<LineBuilder>;
//# sourceMappingURL=ecmarkdown.d.ts.map