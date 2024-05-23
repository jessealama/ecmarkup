"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeFromExpr = exports.meet = exports.join = exports.typecheck = void 0;
const expr_parser_1 = require("./expr-parser");
const utils_1 = require("./utils");
function typecheck(spec) {
    const isUnused = (t) => {
        var _a;
        return t.kind === 'unused' ||
            (t.kind === 'completion' &&
                (t.completionType === 'abrupt' || ((_a = t.typeOfValueIfNormal) === null || _a === void 0 ? void 0 : _a.kind) === 'unused'));
    };
    const AOs = spec.biblio
        .localEntries()
        .filter(e => { var _a; return e.type === 'op' && ((_a = e.signature) === null || _a === void 0 ? void 0 : _a.return) != null; });
    const onlyPerformed = new Map(AOs.filter(e => !isUnused(e.signature.return)).map(a => [a.aoid, null]));
    const alwaysAssertedToBeNormal = new Map(
    // prettier-ignore
    AOs
        .filter(e => e.signature.return.kind === 'completion' && !e.skipGlobalChecks)
        .map(a => [a.aoid, null]));
    // TODO strictly speaking this needs to be done in the namespace of the current algorithm
    const opNames = spec.biblio.getOpNames(spec.namespace);
    // TODO move declarations out of loop
    for (const node of spec.doc.querySelectorAll('emu-alg')) {
        if (node.hasAttribute('example') || !('ecmarkdownTree' in node)) {
            continue;
        }
        const tree = node.ecmarkdownTree;
        if (tree == null) {
            continue;
        }
        const originalHtml = node.originalHtml;
        const expressionVisitor = (expr, path) => {
            if (expr.name !== 'call' && expr.name !== 'sdo-call') {
                return;
            }
            const { callee, arguments: args } = expr;
            if (!(callee.length === 1 && callee[0].name === 'text')) {
                return;
            }
            const calleeName = callee[0].contents;
            const warn = (message) => {
                const { line, column } = (0, utils_1.offsetToLineAndColumn)(originalHtml, callee[0].location.start.offset);
                spec.warn({
                    type: 'contents',
                    ruleId: 'typecheck',
                    message,
                    node,
                    nodeRelativeLine: line,
                    nodeRelativeColumn: column,
                });
            };
            const biblioEntry = spec.biblio.byAoid(calleeName);
            if (biblioEntry == null) {
                if (!['toUppercase', 'toLowercase'].includes(calleeName)) {
                    // TODO make the spec not do this
                    warn(`could not find definition for ${calleeName}`);
                }
                return;
            }
            if (biblioEntry.kind === 'syntax-directed operation' && expr.name === 'call') {
                warn(`${calleeName} is a syntax-directed operation and should not be invoked like a regular call`);
            }
            else if (biblioEntry.kind != null &&
                biblioEntry.kind !== 'syntax-directed operation' &&
                expr.name === 'sdo-call') {
                warn(`${calleeName} is not a syntax-directed operation but here is being invoked as one`);
            }
            if (biblioEntry.signature == null) {
                return;
            }
            const { signature } = biblioEntry;
            const min = signature.parameters.length;
            const max = min + signature.optionalParameters.length;
            if (args.length < min || args.length > max) {
                const count = `${min}${min === max ? '' : `-${max}`}`;
                const message = `${calleeName} takes ${count} argument${count === '1' ? '' : 's'}, but this invocation passes ${args.length}`;
                warn(message);
            }
            else {
                const params = signature.parameters.concat(signature.optionalParameters);
                for (const [arg, param] of (0, utils_1.zip)(args, params, true)) {
                    if (param.type == null)
                        continue;
                    const argType = typeFromExpr(arg, spec.biblio);
                    const paramType = typeFromExprType(param.type);
                    // often we can't infer the argument precisely, so we check only that the intersection is nonempty rather than that the argument type is a subtype of the parameter type
                    const intersection = meet(argType, paramType);
                    if (intersection.kind === 'never' ||
                        (intersection.kind === 'list' &&
                            intersection.of.kind === 'never' &&
                            // if the meet is list<never>, and we're passing a concrete list, it had better be empty
                            argType.kind === 'list' &&
                            argType.of.kind !== 'never')) {
                        const items = stripWhitespace(arg.items);
                        const { line, column } = (0, utils_1.offsetToLineAndColumn)(originalHtml, items[0].location.start.offset);
                        const argDescriptor = argType.kind.startsWith('concrete') ||
                            argType.kind === 'enum value' ||
                            argType.kind === 'null' ||
                            argType.kind === 'undefined'
                            ? `(${serialize(argType)})`
                            : `type (${serialize(argType)})`;
                        let hint = '';
                        if (argType.kind === 'concrete number' && dominates({ kind: 'real' }, paramType)) {
                            hint =
                                '\nhint: you passed an ES language Number, but this position takes a mathematical value';
                        }
                        else if (argType.kind === 'concrete real' &&
                            dominates({ kind: 'number' }, paramType)) {
                            hint =
                                '\nhint: you passed a mathematical value, but this position takes an ES language Number';
                        }
                        else if (argType.kind === 'concrete real' &&
                            dominates({ kind: 'bigint' }, paramType)) {
                            hint =
                                '\nhint: you passed a mathematical value, but this position takes an ES language BigInt';
                        }
                        spec.warn({
                            type: 'contents',
                            ruleId: 'typecheck',
                            message: `argument ${argDescriptor} does not look plausibly assignable to parameter type (${serialize(paramType)})${hint}`,
                            node,
                            nodeRelativeLine: line,
                            nodeRelativeColumn: column,
                        });
                    }
                }
            }
            const { return: returnType } = signature;
            if (returnType == null) {
                return;
            }
            const consumedAsCompletion = isConsumedAsCompletion(expr, path);
            // checks elsewhere ensure that well-formed documents never have a union of completion and non-completion, so checking the first child suffices
            // TODO: this is for 'a break completion or a throw completion', which is kind of a silly union; maybe address that in some other way?
            const isCompletion = returnType.kind === 'completion' ||
                (returnType.kind === 'union' && returnType.types[0].kind === 'completion');
            if (['Completion', 'ThrowCompletion', 'NormalCompletion'].includes(calleeName)) {
                if (consumedAsCompletion) {
                    warn(`${calleeName} clearly creates a Completion Record; it does not need to be marked as such, and it would not be useful to immediately unwrap its result`);
                }
            }
            else if (isCompletion && !consumedAsCompletion) {
                warn(`${calleeName} returns a Completion Record, but is not consumed as if it does`);
            }
            else if (!isCompletion && consumedAsCompletion) {
                warn(`${calleeName} does not return a Completion Record, but is consumed as if it does`);
            }
            if (returnType.kind === 'unused' && !isCalledAsPerform(expr, path, false)) {
                warn(`${calleeName} does not return a meaningful value and should only be invoked as \`Perform ${calleeName}(...).\``);
            }
            if (onlyPerformed.has(calleeName) && onlyPerformed.get(calleeName) !== 'top') {
                const old = onlyPerformed.get(calleeName);
                const performed = isCalledAsPerform(expr, path, true);
                if (!performed) {
                    onlyPerformed.set(calleeName, 'top');
                }
                else if (old === null) {
                    onlyPerformed.set(calleeName, 'only performed');
                }
            }
            if (alwaysAssertedToBeNormal.has(calleeName) &&
                alwaysAssertedToBeNormal.get(calleeName) !== 'top') {
                const old = alwaysAssertedToBeNormal.get(calleeName);
                const asserted = isAssertedToBeNormal(expr, path);
                if (!asserted) {
                    alwaysAssertedToBeNormal.set(calleeName, 'top');
                }
                else if (old === null) {
                    alwaysAssertedToBeNormal.set(calleeName, 'always asserted normal');
                }
            }
        };
        const walkLines = (list) => {
            var _a;
            for (const line of list.contents) {
                const item = (0, expr_parser_1.parse)(line.contents, opNames);
                if (item.name === 'failure') {
                    const { line, column } = (0, utils_1.offsetToLineAndColumn)(originalHtml, item.offset);
                    spec.warn({
                        type: 'contents',
                        ruleId: 'expression-parsing',
                        message: item.message,
                        node,
                        nodeRelativeLine: line,
                        nodeRelativeColumn: column,
                    });
                }
                else {
                    (0, expr_parser_1.walk)(expressionVisitor, item);
                }
                if (((_a = line.sublist) === null || _a === void 0 ? void 0 : _a.name) === 'ol') {
                    walkLines(line.sublist);
                }
            }
        };
        walkLines(tree.contents);
    }
    for (const [aoid, state] of onlyPerformed) {
        if (state !== 'only performed') {
            continue;
        }
        const message = `${aoid} is only ever invoked with Perform, so it should return ~unused~ or a Completion Record which, if normal, contains ~unused~`;
        const ruleId = 'perform-not-unused';
        const biblioEntry = spec.biblio.byAoid(aoid);
        if (biblioEntry._node) {
            spec.spec.warn({
                type: 'node',
                ruleId,
                message,
                node: biblioEntry._node,
            });
        }
        else {
            spec.spec.warn({
                type: 'global',
                ruleId,
                message,
            });
        }
    }
    for (const [aoid, state] of alwaysAssertedToBeNormal) {
        if (state !== 'always asserted normal') {
            continue;
        }
        if (aoid === 'AsyncGeneratorAwaitReturn') {
            // TODO remove this when https://github.com/tc39/ecma262/issues/2412 is fixed
            continue;
        }
        const message = `every call site of ${aoid} asserts the return value is a normal completion; it should be refactored to not return a completion record at all. if this AO is called in ways ecmarkup cannot analyze, add the "skip global checks" attribute to the header.`;
        const ruleId = 'always-asserted-normal';
        const biblioEntry = spec.biblio.byAoid(aoid);
        if (biblioEntry._node) {
            spec.spec.warn({
                type: 'node',
                ruleId,
                message,
                node: biblioEntry._node,
            });
        }
        else {
            spec.spec.warn({
                type: 'global',
                ruleId,
                message,
            });
        }
    }
}
exports.typecheck = typecheck;
function isCalledAsPerform(expr, path, allowQuestion) {
    const prev = previousText(expr, path);
    return prev != null && (allowQuestion ? /\bperform ([?!]\s)?$/i : /\bperform $/i).test(prev);
}
function isAssertedToBeNormal(expr, path) {
    const prev = previousText(expr, path);
    return prev != null && /\s!\s$/.test(prev);
}
function isConsumedAsCompletion(expr, path) {
    const part = parentSkippingBlankSpace(expr, path);
    if (part == null) {
        return false;
    }
    const { parent, index } = part;
    if (parent.name === 'seq') {
        // if the previous text ends in `! ` or `? `, this is a completion
        const text = textFromPreviousPart(parent, index);
        if (text != null && /[!?]\s$/.test(text)) {
            return true;
        }
    }
    else if (parent.name === 'call' && index === 0 && parent.arguments.length === 1) {
        // if this is `Completion(Expr())`, this is a completion
        const parts = parent.callee;
        if (parts.length === 1 && parts[0].name === 'text' && parts[0].contents === 'Completion') {
            return true;
        }
    }
    return false;
}
function parentSkippingBlankSpace(expr, path) {
    for (let pointer = expr, i = path.length - 1; i >= 0; pointer = path[i].parent, --i) {
        const { parent } = path[i];
        if (parent.name === 'seq' &&
            parent.items.every(i => i === pointer || i.name === 'tag' || (i.name === 'text' && /^\s*$/.test(i.contents)))) {
            // if parent is just whitespace/tags around the call, walk up the tree further
            continue;
        }
        return path[i];
    }
    return null;
}
function previousText(expr, path) {
    const part = parentSkippingBlankSpace(expr, path);
    if (part == null) {
        return null;
    }
    const { parent, index } = part;
    if (parent.name === 'seq') {
        return textFromPreviousPart(parent, index);
    }
    return null;
}
function textFromPreviousPart(seq, index) {
    let prevIndex = index - 1;
    let prev;
    while ((0, expr_parser_1.isProsePart)((prev = seq.items[prevIndex]))) {
        if (prev.name === 'text') {
            return prev.contents;
        }
        else if (prev.name === 'tag') {
            --prevIndex;
        }
        else {
            break;
        }
    }
    return null;
}
function stripWhitespace(items) {
    var _a, _b;
    items = [...items];
    while (((_a = items[0]) === null || _a === void 0 ? void 0 : _a.name) === 'text' && /^\s+$/.test(items[0].contents)) {
        items.shift();
    }
    while (((_b = items[items.length - 1]) === null || _b === void 0 ? void 0 : _b.name) === 'text' &&
        // @ts-expect-error
        /^\s+$/.test(items[items.length - 1].contents)) {
        items.pop();
    }
    return items;
}
const simpleKinds = new Set([
    'unknown',
    'never',
    'record',
    'real',
    'integer',
    'non-negative integer',
    'negative integer',
    'positive integer',
    'ES value',
    'string',
    'number',
    'integral number',
    'bigint',
    'boolean',
    'null',
    'undefined',
]);
const dominateGraph = {
    // @ts-expect-error TS does not know about __proto__
    __proto__: null,
    record: ['completion'],
    real: [
        'integer',
        'non-negative integer',
        'negative integer',
        'positive integer',
        'concrete real',
    ],
    integer: ['non-negative integer', 'negative integer', 'positive integer'],
    'non-negative integer': ['positive integer'],
    'ES value': [
        'string',
        'number',
        'integral number',
        'bigint',
        'boolean',
        'null',
        'undefined',
        'concrete string',
        'concrete number',
        'concrete bigint',
        'concrete boolean',
    ],
    string: ['concrete string'],
    number: ['integral number', 'concrete number'],
    bigint: ['concrete bigint'],
    boolean: ['concrete boolean'],
};
/*
The type lattice used here is very simple (aside from explicit unions).
As such we mostly only need to define the `dominates` relationship and apply trivial rules:
if `x` dominates `y`, then `join(x,y) = x` and `meet(x,y) = y`; if neither dominates the other than the join is top and the meet is bottom.
Unions/lists/completions take a little more work.
*/
function dominates(a, b) {
    var _a, _b;
    if (a.kind === 'unknown' || b.kind === 'never') {
        return true;
    }
    if (b.kind === 'union') {
        return b.of.every(t => dominates(a, t));
    }
    if (a.kind === 'union') {
        // not necessarily true for arbitrary lattices, but true for ours
        return a.of.some(t => dominates(t, b));
    }
    if ((a.kind === 'list' && b.kind === 'list') ||
        (a.kind === 'completion' && b.kind === 'completion')) {
        return dominates(a.of, b.of);
    }
    if (simpleKinds.has(a.kind) && simpleKinds.has(b.kind) && a.kind === b.kind) {
        return true;
    }
    if ((_b = (_a = dominateGraph[a.kind]) === null || _a === void 0 ? void 0 : _a.includes(b.kind)) !== null && _b !== void 0 ? _b : false) {
        return true;
    }
    if (a.kind === 'integer' && b.kind === 'concrete real') {
        return !b.value.includes('.');
    }
    if (a.kind === 'integral number' && b.kind === 'concrete number') {
        return Number.isFinite(b.value) && b.value === Math.round(b.value);
    }
    if (a.kind === 'non-negative integer' && b.kind === 'concrete real') {
        return !b.value.includes('.') && b.value[0] !== '-';
    }
    if (a.kind === 'negative integer' && b.kind === 'concrete real') {
        return !b.value.includes('.') && b.value[0] === '-';
    }
    if (a.kind === 'positive integer' && b.kind === 'concrete real') {
        return !b.value.includes('.') && b.value[0] !== '-' && b.value !== '0';
    }
    if (a.kind === b.kind &&
        [
            'concrete string',
            'concrete number',
            'concrete real',
            'concrete bigint',
            'concrete boolean',
            'enum value',
        ].includes(a.kind)) {
        // @ts-expect-error TS is not quite smart enough for this
        return Object.is(a.value, b.value);
    }
    return false;
}
function addToUnion(types, type) {
    if (types.some(t => dominates(t, type))) {
        return { kind: 'union', of: types };
    }
    const live = types.filter(t => !dominates(type, t));
    if (live.length === 0) {
        return type;
    }
    return { kind: 'union', of: [...live, type] };
}
function join(a, b) {
    if (dominates(a, b)) {
        return a;
    }
    if (dominates(b, a)) {
        return b;
    }
    if (b.kind === 'union') {
        [a, b] = [b, a];
    }
    if (a.kind === 'union') {
        if (b.kind === 'union') {
            return b.of.reduce((acc, t) => (acc.kind === 'union' ? addToUnion(acc.of, t) : join(acc, t)), a);
        }
        return addToUnion(a.of, b);
    }
    if ((a.kind === 'list' && b.kind === 'list') ||
        (a.kind === 'completion' && b.kind === 'completion')) {
        return { kind: a.kind, of: join(a.of, b.of) };
    }
    return { kind: 'union', of: [a, b] };
}
exports.join = join;
function meet(a, b) {
    if (dominates(a, b)) {
        return b;
    }
    if (dominates(b, a)) {
        return a;
    }
    if (a.kind !== 'union' && b.kind === 'union') {
        [a, b] = [b, a];
    }
    if (a.kind === 'union') {
        // union is join. meet distributes over join.
        return a.of.map(t => meet(t, b)).reduce(join);
    }
    if ((a.kind === 'list' && b.kind === 'list') ||
        (a.kind === 'completion' && b.kind === 'completion')) {
        return { kind: a.kind, of: meet(a.of, b.of) };
    }
    return { kind: 'never' };
}
exports.meet = meet;
function serialize(type) {
    switch (type.kind) {
        case 'unknown': {
            return 'unknown';
        }
        case 'never': {
            return 'never';
        }
        case 'union': {
            const parts = type.of.map(serialize);
            if (parts.length > 2) {
                return parts.slice(0, -1).join(', ') + ', or ' + parts[parts.length - 1];
            }
            return parts[0] + ' or ' + parts[1];
        }
        case 'list': {
            if (type.of.kind === 'never') {
                return 'empty List';
            }
            return 'List of ' + serialize(type.of);
        }
        case 'record': {
            return 'Record';
        }
        case 'completion': {
            if (type.of.kind === 'never') {
                return 'an abrupt Completion Record';
            }
            else if (type.of.kind === 'unknown') {
                return 'a Completion Record';
            }
            return 'a Completion Record normally holding ' + serialize(type.of);
        }
        case 'real': {
            return 'mathematical value';
        }
        case 'integer':
        case 'non-negative integer':
        case 'negative integer':
        case 'positive integer':
        case 'null':
        case 'undefined': {
            return type.kind;
        }
        case 'concrete string': {
            return `"${type.value}"`;
        }
        case 'concrete real': {
            return type.value;
        }
        case 'concrete boolean': {
            return `${type.value}`;
        }
        case 'enum value': {
            return `~${type.value}~`;
        }
        case 'concrete number': {
            if (Object.is(type.value, 0 / 0)) {
                return '*NaN*';
            }
            let repr;
            if (Object.is(type.value, -0)) {
                repr = '-0';
            }
            else if (type.value === 0) {
                repr = '+0';
            }
            else if (type.value === 2e308) {
                repr = '+&infin;';
            }
            else if (type.value === -2e308) {
                repr = '-&infin;';
            }
            else if (type.value > 4503599627370495.5) {
                repr = String(BigInt(type.value));
            }
            else {
                repr = String(type.value);
            }
            return `*${repr}*<sub>𝔽</sub>`;
        }
        case 'concrete bigint': {
            return `*${type.value}*<sub>ℤ</sub>`;
        }
        case 'ES value': {
            return 'ECMAScript language value';
        }
        case 'boolean': {
            return 'Boolean';
        }
        case 'string': {
            return 'String';
        }
        case 'number': {
            return 'Number';
        }
        case 'integral number': {
            return 'integral Number';
        }
        case 'bigint': {
            return 'BigInt';
        }
    }
}
function typeFromExpr(expr, biblio) {
    var _a, _b;
    seq: if (expr.name === 'seq') {
        const items = stripWhitespace(expr.items);
        if (items.length === 1) {
            expr = items[0];
            break seq;
        }
        if (items.length === 2 &&
            items[0].name === 'star' &&
            items[0].contents[0].name === 'text' &&
            items[1].name === 'text') {
            switch (items[1].contents) {
                case '𝔽': {
                    const text = items[0].contents[0].contents;
                    let value;
                    if (text === '-0') {
                        value = -0;
                    }
                    else if (text === '+&infin;') {
                        value = 2e308;
                    }
                    else if (text === '-&infin;') {
                        value = -2e308;
                    }
                    else {
                        value = parseFloat(text);
                    }
                    return { kind: 'concrete number', value };
                }
                case 'ℤ': {
                    return { kind: 'concrete bigint', value: BigInt(items[0].contents[0].contents) };
                }
            }
        }
        if (((_a = items[0]) === null || _a === void 0 ? void 0 : _a.name) === 'text' && ['!', '?'].includes(items[0].contents.trim())) {
            const remaining = stripWhitespace(items.slice(1));
            if (remaining.length === 1 && ['call', 'sdo-call'].includes(remaining[0].name)) {
                const callType = typeFromExpr(remaining[0], biblio);
                if (callType.kind === 'completion') {
                    return callType.of;
                }
            }
        }
    }
    switch (expr.name) {
        case 'text': {
            const text = expr.contents.trim();
            if (/^-?[0-9]+(\.[0-9]+)?$/.test(text)) {
                return { kind: 'concrete real', value: text };
            }
            break;
        }
        case 'list': {
            return {
                kind: 'list',
                of: expr.elements.map(t => typeFromExpr(t, biblio)).reduce(join, { kind: 'never' }),
            };
        }
        case 'record': {
            return { kind: 'record' };
        }
        case 'call':
        case 'sdo-call': {
            const { callee } = expr;
            if (!(callee.length === 1 && callee[0].name === 'text')) {
                break;
            }
            const calleeName = callee[0].contents;
            const biblioEntry = biblio.byAoid(calleeName);
            if (((_b = biblioEntry === null || biblioEntry === void 0 ? void 0 : biblioEntry.signature) === null || _b === void 0 ? void 0 : _b.return) == null) {
                break;
            }
            return typeFromExprType(biblioEntry.signature.return);
        }
        case 'tilde': {
            if (expr.contents.length === 1 && expr.contents[0].name === 'text') {
                return { kind: 'enum value', value: expr.contents[0].contents };
            }
            break;
        }
        case 'star': {
            if (expr.contents.length === 1 && expr.contents[0].name === 'text') {
                const text = expr.contents[0].contents;
                if (text === 'null') {
                    return { kind: 'null' };
                }
                else if (text === 'undefined') {
                    return { kind: 'undefined' };
                }
                else if (text === 'NaN') {
                    return { kind: 'concrete number', value: 0 / 0 };
                }
                else if (text === 'true') {
                    return { kind: 'concrete boolean', value: true };
                }
                else if (text === 'false') {
                    return { kind: 'concrete boolean', value: false };
                }
                else if (text.startsWith('"') && text.endsWith('"')) {
                    return { kind: 'concrete string', value: text.slice(1, -1) };
                }
            }
            break;
        }
    }
    return { kind: 'unknown' };
}
exports.typeFromExpr = typeFromExpr;
function typeFromExprType(type) {
    switch (type.kind) {
        case 'union': {
            return type.types.map(typeFromExprType).reduce(join);
        }
        case 'list': {
            return {
                kind: 'list',
                of: type.elements == null ? { kind: 'unknown' } : typeFromExprType(type.elements),
            };
        }
        case 'completion': {
            if (type.completionType === 'abrupt') {
                return { kind: 'completion', of: { kind: 'never' } };
            }
            return {
                kind: 'completion',
                of: type.typeOfValueIfNormal == null
                    ? { kind: 'unknown' }
                    : typeFromExprType(type.typeOfValueIfNormal),
            };
        }
        case 'opaque': {
            const text = type.type;
            if (text.startsWith('"') && text.endsWith('"')) {
                return { kind: 'concrete string', value: text.slice(1, -1) };
            }
            if (text.startsWith('~') && text.endsWith('~')) {
                return { kind: 'enum value', value: text.slice(1, -1) };
            }
            if (/^-?[0-9]+(\.[0-9]+)?$/.test(text)) {
                return { kind: 'concrete real', value: text };
            }
            if (text.startsWith('*') && text.endsWith('*<sub>𝔽</sub>')) {
                const innerText = text.slice(1, -14);
                let value;
                if (innerText === '-0') {
                    value = -0;
                }
                else if (innerText === '+&infin;') {
                    value = 2e308;
                }
                else if (innerText === '-&infin;') {
                    value = -2e308;
                }
                else {
                    value = parseFloat(innerText);
                }
                return { kind: 'concrete number', value };
            }
            if (text === '*NaN*') {
                return { kind: 'concrete number', value: 0 / 0 };
            }
            if (text.startsWith('*') && text.endsWith('*<sub>ℤ</sub>')) {
                return { kind: 'concrete bigint', value: BigInt(text.slice(1, -14)) };
            }
            if (text === 'an ECMAScript language value' || text === 'ECMAScript language values') {
                return { kind: 'ES value' };
            }
            if (text === 'a String' || text === 'Strings') {
                return { kind: 'string' };
            }
            if (text === 'a Number' || text === 'Numbers') {
                return { kind: 'number' };
            }
            if (text === 'a Boolean' || text === 'Booleans') {
                return { kind: 'boolean' };
            }
            if (text === 'a BigInt' || text === 'BigInts') {
                return { kind: 'bigint' };
            }
            if (text === 'an integral Number' || text === 'integral Numbers') {
                return { kind: 'integral number' };
            }
            if (text === 'a mathematical value' || text === 'mathematical values') {
                return { kind: 'real' };
            }
            if (text === 'an integer' || text === 'integers') {
                return { kind: 'integer' };
            }
            if (text === 'a non-negative integer' || text === 'non-negative integers') {
                return { kind: 'non-negative integer' };
            }
            if (text === 'a negative integer' || text === 'negative integers') {
                return { kind: 'negative integer' };
            }
            if (text === 'a positive integer' || text === 'positive integers') {
                return { kind: 'positive integer' };
            }
            if (text === 'a time value' || text === 'time values') {
                return {
                    kind: 'union',
                    of: [{ kind: 'integral number' }, { kind: 'concrete number', value: 0 / 0 }],
                };
            }
            if (text === '*null*') {
                return { kind: 'null' };
            }
            if (text === '*undefined*') {
                return { kind: 'undefined' };
            }
            break;
        }
        case 'unused': {
            // this is really only a return type, but might as well handle it
            return { kind: 'enum value', value: '~unused~' };
        }
    }
    return { kind: 'unknown' };
}
//# sourceMappingURL=typechecker.js.map