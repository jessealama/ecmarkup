import type { Context } from './Context';
import type { SourceFile } from 'grammarkdown';
import Builder from './Builder';
export type AugmentedGrammarEle = HTMLElement & {
    grammarkdownOut: string;
    grammarSource: SourceFile;
};
export default class Grammar extends Builder {
    static enter({ spec, node, clauseStack }: Context): Promise<void>;
    static readonly elements: readonly ["EMU-GRAMMAR"];
}
//# sourceMappingURL=Grammar.d.ts.map