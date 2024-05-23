import type { Production, RightHandSide, OneOfList, SourceFile, Grammar as GrammarFile } from 'grammarkdown';
import type { Node as EcmarkdownNode } from 'ecmarkdown';
export declare function getProductions(sourceFiles: readonly SourceFile[]): Map<string, {
    production: Production;
    rhses: (RightHandSide | OneOfList)[];
}>;
export declare function rhsMatches(a: RightHandSide | OneOfList, b: RightHandSide | OneOfList): boolean;
export declare function getLocationInGrammarFile(file: SourceFile, pos: number): {
    line: number;
    column: number;
};
export declare function collectNonterminalsFromGrammar(grammar: GrammarFile): {
    name: string;
    loc: {
        line: number;
        column: number;
    };
}[];
export declare function collectNonterminalsFromEmd(emdNode: EcmarkdownNode | EcmarkdownNode[]): {
    name: string;
    loc: {
        line: number;
        column: number;
    };
}[];
//# sourceMappingURL=utils.d.ts.map