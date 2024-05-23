import type Spec from './Spec';
type ParseError = {
    message: string;
    offset: number;
};
type BaseParam = {
    name: string;
    wrappingTag: 'ins' | 'del' | 'mark' | null;
};
export type Param = BaseParam & ({
    type: null;
} | {
    type: string;
    typeOffset: number;
});
type ParsedHeaderWithoutReturn = {
    type: 'single-line' | 'multi-line';
    wrappingTag: 'ins' | 'del' | 'mark' | null;
    prefix: string | null;
    name: string;
    params: Param[];
    optionalParams: Param[];
    returnType: string | null;
    errors: ParseError[];
};
export type ParsedHeader = ParsedHeaderWithoutReturn & ({
    returnType: null;
} | {
    returnType: string;
    returnOffset: number;
});
export type ParsedHeaderOrFailure = ParsedHeader | {
    type: 'failure';
    errors: ParseError[];
};
export declare function parseH1(headerText: string): ParsedHeaderOrFailure;
export declare function printParam(p: Param): string;
export declare function printSimpleParamList(params: Param[], optionalParams: Param[]): string;
export declare function formatHeader(spec: Spec, header: Element, parseResult: ParsedHeaderOrFailure): {
    name: string | null;
    formattedHeader: string | null;
    formattedParams: string | null;
    formattedReturnType: string | null;
};
export declare function parseStructuredHeaderDl(spec: Spec, type: string | null, dl: Element): {
    description: Element | null;
    for: Element | null;
    effects: string[];
    redefinition: boolean;
    skipGlobalChecks: boolean;
};
export declare function formatPreamble(spec: Spec, clause: Element, dl: Element, type: string | null, name: string, formattedParams: string, formattedReturnType: string | null, _for: Element | null, description: Element | null): Array<Element>;
export declare function formatEnglishList(list: Array<string>, conjuction?: string): string;
export {};
//# sourceMappingURL=header-parser.d.ts.map