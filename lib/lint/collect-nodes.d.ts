import type { default as Spec, Warning } from '../Spec';
import type { AlgorithmNode } from 'ecmarkdown';
type CollectNodesReturnType = {
    success: true;
    headers: {
        element: Element;
        contents: string;
    }[];
    mainGrammar: {
        element: Element;
        source: string;
    }[];
    sdos: {
        grammar: Element;
        alg: Element;
    }[];
    earlyErrors: {
        grammar: Element;
        lists: HTMLUListElement[];
    }[];
    algorithms: {
        element: Element;
        tree?: AlgorithmNode;
        source?: string;
    }[];
} | {
    success: false;
};
export declare function collectNodes(report: (e: Warning) => void, mainSource: string, spec: Spec, document: Document): CollectNodesReturnType;
export {};
//# sourceMappingURL=collect-nodes.d.ts.map