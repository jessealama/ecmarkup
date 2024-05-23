import type { Context } from './Context';
import type { AlgorithmNode } from 'ecmarkdown';
import Builder from './Builder';
export type AlgorithmElementWithTree = HTMLElement & {
    ecmarkdownTree: AlgorithmNode | null;
    originalHtml: string;
};
export default class Algorithm extends Builder {
    static enter(context: Context): Promise<void>;
    static exit(context: Context): void;
    static readonly elements: readonly ["EMU-ALG"];
}
//# sourceMappingURL=Algorithm.d.ts.map