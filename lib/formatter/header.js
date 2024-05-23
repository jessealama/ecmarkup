"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printHeader = void 0;
const header_parser_1 = require("../header-parser");
const line_builder_1 = require("./line-builder");
function printTypedParam(param, optional) {
    var _a;
    let p = (optional ? 'optional ' : '') + param.name + ': ' + ((_a = param.type) !== null && _a !== void 0 ? _a : 'unknown') + ',';
    if (param.wrappingTag) {
        p = `<${param.wrappingTag}>${p}</${param.wrappingTag}>`;
    }
    return p;
}
function ensureUnderscores(param) {
    if (!/^[a-zA-Z0-9]+$/.test(param.name)) {
        return param;
    }
    return {
        ...param,
        name: '_' + param.name + '_',
    };
}
function printHeader(parseResult, clauseType, indent) {
    /* eslint-disable prefer-const */
    let { type, wrappingTag, prefix, name, params, optionalParams, returnType,
    // errors is already handled
     } = parseResult;
    /* eslint-enable prefer-const */
    const result = new line_builder_1.LineBuilder(indent);
    if (type === 'multi-line') {
        result.firstLineIsPartial = false;
    }
    if (wrappingTag !== null) {
        result.appendText(`<${wrappingTag}>`);
    }
    if (prefix !== null) {
        result.appendText(prefix + ' ');
    }
    result.appendText(name);
    params = params.map(ensureUnderscores);
    optionalParams = optionalParams.map(ensureUnderscores);
    if (clauseType === 'sdo' &&
        params.length === 0 &&
        optionalParams.length === 0 &&
        returnType === null) {
        // do not print a parameter list
    }
    else if (type === 'single-line') {
        result.appendText(' ' + (0, header_parser_1.printSimpleParamList)(params, optionalParams));
    }
    else {
        result.appendText(' (');
        ++result.indent;
        for (const param of params) {
            result.appendLine(printTypedParam(param, false));
        }
        for (const param of optionalParams) {
            result.appendLine(printTypedParam(param, true));
        }
        --result.indent;
        result.appendText(')');
    }
    if (returnType !== null && returnType !== '') {
        result.appendText(': ' + returnType);
    }
    if (wrappingTag !== null) {
        result.appendText(`</${wrappingTag}>`);
    }
    if (type === 'multi-line') {
        result.linebreak();
    }
    return result;
}
exports.printHeader = printHeader;
//# sourceMappingURL=header.js.map