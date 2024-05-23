import type { default as Spec, Warning } from '../Spec';
import { Grammar as GrammarFile } from 'grammarkdown';
export declare function collectGrammarDiagnostics(report: (e: Warning) => void, spec: Spec, mainSource: string, mainGrammar: {
    element: Element;
    source: string;
}[], sdos: {
    grammar: Element;
    alg: Element;
}[], earlyErrors: {
    grammar: Element;
    lists: HTMLUListElement[];
}[]): Promise<{
    grammar: GrammarFile;
    oneOffGrammars: {
        grammarEle: Element;
        grammar: GrammarFile;
    }[];
}>;
//# sourceMappingURL=collect-grammar-diagnostics.d.ts.map