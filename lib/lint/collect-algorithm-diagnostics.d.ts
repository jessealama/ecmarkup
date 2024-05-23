import type { Node as EcmarkdownNode } from 'ecmarkdown';
import type { default as Spec, Warning } from '../Spec';
export declare function collectAlgorithmDiagnostics(report: (e: Warning) => void, spec: Spec, mainSource: string, algorithms: {
    element: Element;
    tree?: EcmarkdownNode;
    source?: string;
}[]): void;
//# sourceMappingURL=collect-algorithm-diagnostics.d.ts.map