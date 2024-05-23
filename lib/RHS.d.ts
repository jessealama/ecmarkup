import type Spec from './Spec';
import type Production from './Production';
import Builder from './Builder';
export default class RHS extends Builder {
    constructor(spec: Spec, prod: Production, node: HTMLElement);
    build(): void;
    terminalify(parentNode: Element): void;
    private wrapTerminal;
}
//# sourceMappingURL=RHS.d.ts.map