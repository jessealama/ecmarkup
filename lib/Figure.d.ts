import type Spec from './Spec';
import type { Context } from './Context';
import Builder from './Builder';
export default class Figure extends Builder {
    type: string;
    number: number;
    id: string | null;
    isInformative: boolean;
    captionElem: HTMLElement | null;
    caption: string;
    static elements: string[];
    constructor(spec: Spec, node: HTMLElement);
    static enter({ spec, node }: Context): Promise<void>;
}
//# sourceMappingURL=Figure.d.ts.map