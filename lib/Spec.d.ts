/// <reference types="node" />
import type { Options } from './ecmarkup';
import type { ExportedBiblio } from './Biblio';
import Clause from './Clause';
import { CancellationToken } from 'prex';
import type { JSDOM } from 'jsdom';
export type Warning = {
    type: 'global';
    ruleId: string;
    message: string;
} | {
    type: 'node';
    node: Text | Element;
    ruleId: string;
    message: string;
} | {
    type: 'attr';
    node: Element;
    attr: string;
    ruleId: string;
    message: string;
} | {
    type: 'attr-value';
    node: Element;
    attr: string;
    ruleId: string;
    message: string;
} | {
    type: 'contents';
    node: Text | Element;
    ruleId: string;
    message: string;
    nodeRelativeLine: number;
    nodeRelativeColumn: number;
} | {
    type: 'raw';
    ruleId: string;
    message: string;
    line: number;
    column: number;
    file?: string;
    source?: string;
};
export type WorklistItem = {
    aoid: string | null;
    effects: string[];
};
export declare function maybeAddClauseToEffectWorklist(effectName: string, clause: Clause, worklist: WorklistItem[]): void;
export default class Spec {
    spec: this;
    opts: Options;
    rootPath: string;
    rootDir: string;
    namespace: string;
    generatedFiles: Map<string | null, string | Buffer>;
    readonly log: (msg: string) => void;
    readonly warn: (err: Warning) => void | undefined;
    private _fetch;
    constructor(rootPath: string, fetch: (file: string, token: CancellationToken) => PromiseLike<string>, dom: JSDOM, opts: Options | undefined, sourceText: string, token?: CancellationToken);
    private labelClauses;
    private toHTML;
    private buildReferenceGraph;
    private checkValidSectionId;
    private propagateEffects;
    private propagateEffect;
    private annotateExternalLinks;
    private buildMultipage;
    private buildAssets;
    private addStyle;
    private buildSpecWrapper;
    private buildShortcutsHelp;
    private processMetadata;
    private loadBiblios;
    private loadImports;
    exportBiblio(): ExportedBiblio | null;
    private highlightCode;
    private buildBoilerplate;
    private buildCopyrightBoilerplate;
    private generateSDOMap;
    private getProductions;
    private setReplacementAlgorithmOffsets;
    private _updateBySelector;
}
//# sourceMappingURL=Spec.d.ts.map