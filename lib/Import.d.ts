import type Spec from './Spec';
import Builder from './Builder';
import type { JSDOM } from 'jsdom';
export default class Import extends Builder {
    constructor(spec: Spec, node: HTMLElement, importLocation: string, relativeRoot: string, source: string);
    static build(spec: Spec, node: EmuImportElement, root: string): Promise<Import>;
}
export interface EmuImportElement extends HTMLElement {
    href: string;
    dom?: JSDOM;
    source?: string;
    importPath?: string;
}
//# sourceMappingURL=Import.d.ts.map