"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatEnglishList = exports.formatPreamble = exports.parseStructuredHeaderDl = exports.formatHeader = exports.printSimpleParamList = exports.printParam = exports.parseH1 = void 0;
const utils_1 = require("./utils");
function parseH1(headerText) {
    let offset = 0;
    const errors = [];
    let { match, text } = eat(headerText, /^\s*/);
    if (match) {
        offset += match[0].length;
    }
    let wrappingTag = null;
    ({ match, text } = eat(text, /^<(ins|del|mark) *>\s*/i));
    if (match) {
        wrappingTag = match[1].toLowerCase().trimRight();
        offset += match[0].length;
    }
    let prefix = null;
    ({ match, text } = eat(text, /^(Static|Runtime) Semantics:\s*/i));
    if (match) {
        prefix = match[0].trimRight();
        offset += match[0].length;
    }
    ({ match, text } = eat(text, /^[^(\s]+\s*/));
    if (!match) {
        errors.push({ message: 'could not find AO name', offset });
        return { type: 'failure', errors };
    }
    offset += match[0].length;
    const name = match[0].trimRight();
    if (text === '') {
        if (wrappingTag !== null) {
            if (text.endsWith(`</${wrappingTag}>`)) {
                text = text.slice(0, -(3 + wrappingTag.length));
            }
            else {
                errors.push({
                    message: `could not find matching ${wrappingTag} tag`,
                    offset,
                });
            }
        }
        return {
            type: 'single-line',
            prefix,
            name,
            wrappingTag,
            params: [],
            optionalParams: [],
            returnType: null,
            errors,
        };
    }
    ({ match, text } = eat(text, /^\( */));
    if (!match) {
        errors.push({ message: 'expected `(`', offset });
        return { type: 'failure', errors };
    }
    offset += match[0].length;
    let type;
    const params = [];
    const optionalParams = [];
    if (text[0] === '\n') {
        // multiline: parse for parameter types
        type = 'multi-line';
        ({ match, text } = eat(text, /^\s*/));
        offset += match[0].length;
        while (true) {
            ({ match, text } = eat(text, /^\)\s*/));
            if (match) {
                offset += match[0].length;
                break;
            }
            let paramWrappingTag = null;
            ({ match, text } = eat(text, /^<(ins|del|mark) *>\s*/i));
            if (match) {
                paramWrappingTag = match[1].toLowerCase().trimRight();
                offset += match[0].length;
            }
            let optional = false;
            ({ match, text } = eat(text, /^optional */i));
            if (match) {
                optional = true;
                offset += match[0].length;
            }
            else if (optionalParams.length > 0) {
                errors.push({
                    message: 'required parameters should not follow optional parameters',
                    offset,
                });
            }
            ({ match, text } = eat(text, /^[A-Za-z0-9_]+ */i));
            if (!match) {
                errors.push({ message: 'expected parameter name', offset });
                return { type: 'failure', errors };
            }
            offset += match[0].length;
            const paramName = match[0].trimRight();
            ({ match, text } = eat(text, /^:+ */i));
            if (!match) {
                errors.push({ message: 'expected `:`', offset });
                return { type: 'failure', errors };
            }
            offset += match[0].length;
            // TODO handle absence of type, treat as unknown
            const typeOffset = offset;
            ({ match, text } = eat(text, /^[^\n]+\n\s*/i));
            if (!match) {
                errors.push({ message: 'expected a type', offset });
                return { type: 'failure', errors };
            }
            offset += match[0].length;
            let paramType = match[0].trimRight();
            if (paramWrappingTag !== null) {
                if (paramType.endsWith(`</${paramWrappingTag}>`)) {
                    paramType = paramType.slice(0, -(3 + paramWrappingTag.length));
                }
                else {
                    errors.push({
                        message: `could not find matching ${paramWrappingTag} tag`,
                        offset,
                    });
                }
            }
            if (paramType.endsWith(',')) {
                paramType = paramType.slice(0, -1);
            }
            const base = optional ? optionalParams : params;
            if (paramType === 'unknown') {
                base.push({
                    name: paramName,
                    type: null,
                    wrappingTag: paramWrappingTag,
                });
            }
            else {
                base.push({
                    name: paramName,
                    type: paramType,
                    typeOffset,
                    wrappingTag: paramWrappingTag,
                });
            }
        }
    }
    else {
        // single line: no types
        type = 'single-line';
        let optional = false;
        while (true) {
            ({ match, text } = eat(text, /^\)\s*/));
            if (match) {
                offset += match[0].length;
                break;
            }
            ({ text, match } = eat(text, /^\[(\s*,)?\s*/));
            if (match) {
                optional = true;
                offset += match[0].length;
            }
            ({ text, match } = eat(text, /^([A-Za-z0-9_]+)\s*/));
            if (!match) {
                errors.push({ message: 'expected parameter name', offset });
                return { type: 'failure', errors };
            }
            offset += match[0].length;
            const paramName = match[0].trimRight();
            (optional ? optionalParams : params).push({
                name: paramName,
                type: null,
                wrappingTag: null,
            });
            ({ match, text } = eat(text, /^((\s*\])+|,)\s*/));
            if (match) {
                offset += match[0].length;
            }
        }
    }
    let returnOffset = 0;
    let returnType = null;
    ({ match, text } = eat(text, /^: */));
    if (match) {
        offset += match[0].length;
        returnOffset = offset;
        ({ match, text } = eat(text, /^(.*?)(?=<\/(ins|del|mark)>|$)/im));
        if (match) {
            returnType = match[1].trim();
            if (returnType === '') {
                errors.push({ message: 'if a return type is given, it must not be empty', offset });
                returnType = null;
            }
            else if (returnType === 'unknown') {
                returnType = null;
            }
            offset += match[0].length;
        }
    }
    if (wrappingTag !== null) {
        const trimmed = text.trimEnd();
        if (trimmed.endsWith(`</${wrappingTag}>`)) {
            text = trimmed.slice(0, -(3 + wrappingTag.length));
        }
        else {
            errors.push({
                message: `could not find matching ${wrappingTag} tag`,
                offset,
            });
        }
    }
    if (text.trim() !== '') {
        errors.push({
            message: 'unknown extra text in header',
            offset,
        });
    }
    if (returnType == null) {
        return {
            type,
            wrappingTag,
            prefix,
            name,
            params,
            optionalParams,
            returnType,
            errors,
        };
    }
    else {
        return {
            type,
            wrappingTag,
            prefix,
            name,
            params,
            optionalParams,
            returnType,
            returnOffset,
            errors,
        };
    }
}
exports.parseH1 = parseH1;
const printParamWithType = (p) => {
    let result = p.name;
    if (p.type !== null) {
        result += ` (${p.type})`;
    }
    if (p.wrappingTag !== null) {
        result = `<${p.wrappingTag}>${result}</${p.wrappingTag}>`;
    }
    return result;
};
function printParam(p) {
    if (p.wrappingTag !== null) {
        return `<${p.wrappingTag}>${p.name}</${p.wrappingTag}>`;
    }
    return p.name;
}
exports.printParam = printParam;
function printSimpleParamList(params, optionalParams) {
    let result = '(' + params.map(p => ' ' + printParam(p)).join(',');
    if (optionalParams.length > 0) {
        const formattedOptionalParams = optionalParams
            .map((p, i) => ' [ ' + (i > 0 || params.length > 0 ? ', ' : '') + printParam(p))
            .join('');
        result += formattedOptionalParams + optionalParams.map(() => ' ]').join('');
    }
    result += ' )';
    return result;
}
exports.printSimpleParamList = printSimpleParamList;
function formatHeader(spec, header, parseResult) {
    for (const { message, offset } of parseResult.errors) {
        const { line: nodeRelativeLine, column: nodeRelativeColumn } = (0, utils_1.offsetToLineAndColumn)(header.innerHTML, offset);
        spec.warn({
            type: 'contents',
            ruleId: 'header-format',
            message,
            node: header,
            nodeRelativeColumn,
            nodeRelativeLine,
        });
    }
    if (parseResult.type === 'failure') {
        return { name: null, formattedHeader: null, formattedParams: null, formattedReturnType: null };
    }
    const { wrappingTag, prefix, name, params, optionalParams, returnType,
    // errors is already handled
     } = parseResult;
    const paramsWithTypes = params.map(printParamWithType);
    const optionalParamsWithTypes = optionalParams.map(printParamWithType);
    let formattedParams = '';
    if (params.length === 0 && optionalParams.length === 0) {
        formattedParams = 'no arguments';
    }
    else {
        if (params.length > 0) {
            formattedParams =
                (params.length === 1 ? 'argument' : 'arguments') + ' ' + formatEnglishList(paramsWithTypes);
            if (optionalParams.length > 0) {
                formattedParams += ' and ';
            }
        }
        if (optionalParams.length > 0) {
            formattedParams +=
                'optional ' +
                    (optionalParams.length === 1 ? 'argument' : 'arguments') +
                    ' ' +
                    formatEnglishList(optionalParamsWithTypes);
        }
    }
    let formattedHeader = (prefix == null ? '' : prefix + ' ') +
        name +
        ' ' +
        printSimpleParamList(params, optionalParams);
    if (wrappingTag !== null) {
        formattedHeader = `<${wrappingTag}>${formattedHeader}</${wrappingTag}>`;
    }
    return { name, formattedHeader, formattedParams, formattedReturnType: returnType };
}
exports.formatHeader = formatHeader;
function parseStructuredHeaderDl(spec, type, dl) {
    var _a, _b, _c;
    let description = null;
    let _for = null;
    let redefinition = null;
    let effects = [];
    let skipGlobalChecks = null;
    for (let i = 0; i < dl.children.length; ++i) {
        const dt = dl.children[i];
        if (dt.tagName !== 'DT') {
            spec.warn({
                type: 'node',
                ruleId: 'header-format',
                message: `expecting header to have DT, but found ${dt.tagName}`,
                node: dt,
            });
            break;
        }
        ++i;
        const dd = dl.children[i];
        if ((dd === null || dd === void 0 ? void 0 : dd.tagName) !== 'DD') {
            spec.warn({
                type: 'node',
                ruleId: 'header-format',
                message: `expecting header to have DD, but found ${dd.tagName}`,
                node: dd,
            });
            break;
        }
        const dtype = (_a = dt.textContent) !== null && _a !== void 0 ? _a : '';
        switch (dtype.trim().toLowerCase()) {
            case 'description': {
                if (description != null) {
                    spec.warn({
                        type: 'node',
                        ruleId: 'header-format',
                        message: `duplicate "description" attribute`,
                        node: dt,
                    });
                }
                description = dd;
                break;
            }
            case 'for': {
                if (_for != null) {
                    spec.warn({
                        type: 'node',
                        ruleId: 'header-format',
                        message: `duplicate "for" attribute`,
                        node: dt,
                    });
                }
                if (type === 'concrete method' || type === 'internal method') {
                    _for = dd;
                }
                else {
                    spec.warn({
                        type: 'node',
                        ruleId: 'header-format',
                        message: `"for" attributes only apply to concrete or internal methods`,
                        node: dt,
                    });
                }
                break;
            }
            case 'effects': {
                // The dd contains a comma-separated list of effects.
                if (dd.textContent !== null) {
                    effects = (0, utils_1.validateEffects)(spec, dd.textContent.split(',').map(c => c.trim()), dd);
                }
                break;
            }
            case 'redefinition': {
                if (redefinition != null) {
                    spec.warn({
                        type: 'node',
                        ruleId: 'header-format',
                        message: `duplicate "redefinition" attribute`,
                        node: dt,
                    });
                }
                const contents = ((_b = dd.textContent) !== null && _b !== void 0 ? _b : '').trim();
                if (contents === 'true') {
                    redefinition = true;
                }
                else if (contents === 'false') {
                    redefinition = false;
                }
                else {
                    spec.warn({
                        type: 'contents',
                        ruleId: 'header-format',
                        message: `unknown value for "redefinition" attribute (expected "true" or "false", got ${JSON.stringify(contents)})`,
                        node: dd,
                        nodeRelativeLine: 1,
                        nodeRelativeColumn: 1,
                    });
                }
                break;
            }
            case 'skip global checks': {
                if (skipGlobalChecks != null) {
                    spec.warn({
                        type: 'node',
                        ruleId: 'header-format',
                        message: `duplicate "skip global checks" attribute`,
                        node: dt,
                    });
                }
                const contents = ((_c = dd.textContent) !== null && _c !== void 0 ? _c : '').trim();
                if (contents === 'true') {
                    skipGlobalChecks = true;
                }
                else if (contents === 'false') {
                    skipGlobalChecks = false;
                }
                else {
                    spec.warn({
                        type: 'contents',
                        ruleId: 'header-format',
                        message: `unknown value for "skip global checks" attribute (expected "true" or "false", got ${JSON.stringify(contents)})`,
                        node: dd,
                        nodeRelativeLine: 1,
                        nodeRelativeColumn: 1,
                    });
                }
                break;
            }
            case '': {
                spec.warn({
                    type: 'node',
                    ruleId: 'header-format',
                    message: `missing value for structured header attribute`,
                    node: dt,
                });
                break;
            }
            default: {
                spec.warn({
                    type: 'node',
                    ruleId: 'header-format',
                    message: `unknown structured header entry type ${JSON.stringify(dtype)}`,
                    node: dt,
                });
                break;
            }
        }
    }
    return {
        description,
        for: _for,
        effects,
        redefinition: redefinition !== null && redefinition !== void 0 ? redefinition : false,
        skipGlobalChecks: skipGlobalChecks !== null && skipGlobalChecks !== void 0 ? skipGlobalChecks : false,
    };
}
exports.parseStructuredHeaderDl = parseStructuredHeaderDl;
function formatPreamble(spec, clause, dl, type, name, formattedParams, formattedReturnType, _for, description) {
    var _a;
    const para = spec.doc.createElement('p');
    const paras = [para];
    type = (type !== null && type !== void 0 ? type : '').toLowerCase();
    switch (type) {
        case 'numeric method':
        case 'abstract operation': {
            // TODO tests (for each type of parametered thing) which have HTML in the parameter type
            para.innerHTML += `The abstract operation ${name}`;
            break;
        }
        case 'host-defined abstract operation': {
            para.innerHTML += `The host-defined abstract operation ${name}`;
            break;
        }
        case 'implementation-defined abstract operation': {
            para.innerHTML += `The implementation-defined abstract operation ${name}`;
            break;
        }
        case 'sdo':
        case 'syntax-directed operation': {
            para.innerHTML += `The syntax-directed operation ${name}`;
            break;
        }
        case 'internal method':
        case 'concrete method': {
            if (_for == null) {
                spec.warn({
                    type: 'contents',
                    ruleId: 'header-format',
                    message: `expected ${type} to have a "for"`,
                    node: dl,
                    nodeRelativeLine: 1,
                    nodeRelativeColumn: 1,
                });
                _for = spec.doc.createElement('div');
            }
            para.append(`The ${name} ${type} of `, ..._for.childNodes);
            break;
        }
        default: {
            if (type) {
                spec.warn({
                    type: 'attr-value',
                    ruleId: 'header-type',
                    message: `unknown clause type ${JSON.stringify(type)}`,
                    node: clause,
                    attr: 'type',
                });
            }
            else {
                spec.warn({
                    type: 'node',
                    ruleId: 'header-type',
                    message: `clauses with structured headers should have a type`,
                    node: clause,
                });
            }
        }
    }
    para.innerHTML += ` takes ${formattedParams}`;
    if (formattedReturnType != null) {
        para.innerHTML += ` and returns ${formattedReturnType}`;
    }
    para.innerHTML += '.';
    if (description != null) {
        const isJustElements = [...description.childNodes].every(n => { var _a; return n.nodeType === 1 || (n.nodeType === 3 && ((_a = n.textContent) === null || _a === void 0 ? void 0 : _a.trim()) === ''); });
        if (isJustElements) {
            paras.push(...description.childNodes);
        }
        else {
            para.append(' ', ...description.childNodes);
        }
    }
    const isSdo = type === 'sdo' || type === 'syntax-directed operation';
    const lastSentence = isSdo
        ? 'It is defined piecewise over the following productions:'
        : 'It performs the following steps when called:';
    const getRelevantElement = (el) => { var _a; return el.tagName === 'INS' || el.tagName === 'DEL' ? (_a = el.firstElementChild) !== null && _a !== void 0 ? _a : el : el; };
    let next = dl.nextElementSibling;
    while (next != null && ((_a = getRelevantElement(next)) === null || _a === void 0 ? void 0 : _a.tagName) === 'EMU-NOTE') {
        next = next.nextElementSibling;
    }
    const relevant = next != null ? getRelevantElement(next) : null;
    if ((isSdo && next != null && (relevant === null || relevant === void 0 ? void 0 : relevant.tagName) === 'EMU-GRAMMAR') ||
        (!isSdo &&
            next != null &&
            (relevant === null || relevant === void 0 ? void 0 : relevant.tagName) === 'EMU-ALG' &&
            !(relevant === null || relevant === void 0 ? void 0 : relevant.hasAttribute('replaces-step')))) {
        if (paras.length > 1 || next !== dl.nextElementSibling) {
            const whitespace = next.previousSibling;
            const after = spec.doc.createElement('p');
            after.append(lastSentence);
            next.parentElement.insertBefore(after, next);
            // fix up the whitespace in the generated HTML
            if ((whitespace === null || whitespace === void 0 ? void 0 : whitespace.nodeType) === 3 /* TEXT_NODE */ && /^\s+$/.test(whitespace.nodeValue)) {
                next.parentElement.insertBefore(whitespace.cloneNode(), next);
            }
        }
        else {
            para.append(' ' + lastSentence);
        }
    }
    return paras;
}
exports.formatPreamble = formatPreamble;
function formatEnglishList(list, conjuction = 'and') {
    if (list.length === 0) {
        throw new Error('formatEnglishList should not be called with an empty list');
    }
    if (list.length === 1) {
        return list[0];
    }
    if (list.length === 2) {
        return `${list[0]} ${conjuction} ${list[1]}`;
    }
    return `${list.slice(0, -1).join(', ')}, ${conjuction} ${list[list.length - 1]}`;
}
exports.formatEnglishList = formatEnglishList;
function eat(text, regex) {
    const match = text.match(regex);
    if (match == null) {
        return { match, text };
    }
    return { match, text: text.substring(match[0].length) };
}
//# sourceMappingURL=header-parser.js.map