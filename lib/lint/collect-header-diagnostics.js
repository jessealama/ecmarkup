"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectHeaderDiagnostics = void 0;
const Clause_1 = require("../Clause");
const utils_1 = require("../utils");
const ruleId = 'header-format';
function collectHeaderDiagnostics(report, headers) {
    var _a, _b;
    for (const { element, contents } of headers) {
        if ((0, Clause_1.extractStructuredHeader)(element) !== null) {
            // these will be handled by header-parser.ts
            continue;
        }
        if (!/\(.*\)$/.test(contents) || / Operator \( `[^`]+` \)$/.test(contents)) {
            continue;
        }
        const name = contents.substring(0, contents.indexOf('('));
        const params = contents.substring(contents.indexOf('(') + 1, contents.length - 1);
        if (!/[\S] $/.test(name)) {
            const { line, column } = (0, utils_1.offsetToLineAndColumn)(contents, name.length - 1);
            report({
                type: 'contents',
                ruleId,
                message: 'expected header to have a single space before the argument list',
                node: element,
                nodeRelativeLine: line,
                nodeRelativeColumn: column,
            });
        }
        const nameMatches = [
            // Runtime Semantics: Foo
            /^(Runtime|Static) Semantics: [A-Z][A-Za-z0-9/]*\s*$/,
            // Number::foo
            /^[A-Z][A-Za-z0-9]*::[a-z][A-Za-z0-9]*\s*$/,
            // [[GetOwnProperty]]
            /^\[\[[A-Z][A-Za-z0-9]*\]\]\s*$/,
            // ForIn/OfHeadEvaluation
            /^[A-Za-z][A-Za-z0-9/]*\s*$/,
            // CreateForInIterator
            // Object.fromEntries
            // _NativeError_ [ @@whatever ]
            // Array.prototype [ @@iterator ]
            // %ForInIteratorPrototype%.next
            // Object.prototype.__defineGetter__
            /^([%_]?)[A-Za-z][A-Za-z0-9/]*\1(\.[A-Za-z][A-Za-z0-9]*|\.__[a-z][A-Za-z0-9]*__| \[ @@[a-z][a-zA-Z]+ \])*\s*$/,
        ].some(r => r.test(name));
        if (!nameMatches) {
            const { line, column } = (0, utils_1.offsetToLineAndColumn)(contents, 0);
            report({
                type: 'contents',
                ruleId,
                message: `expected operation to have a name like 'Example', 'Runtime Semantics: Foo', 'Example.prop', etc, but found ${JSON.stringify(name)}`,
                node: element,
                nodeRelativeLine: line,
                nodeRelativeColumn: column,
            });
        }
        const paramsMatches = ((_a = params.match(/\[/g)) === null || _a === void 0 ? void 0 : _a.length) === ((_b = params.match(/\]/g)) === null || _b === void 0 ? void 0 : _b.length) &&
            [
                // Foo ( )
                /^ $/,
                // Object ( . . . )
                /^ \. \. \. $/,
                // String.raw ( _template_, ..._substitutions_ )
                // Function ( _p1_, _p2_, &hellip; , _pn_, _body_ )
                // Function ( ..._parameterArgs_, _bodyArg_ )
                /^ (_[A-Za-z0-9]+_, )*(\.\.\.|&hellip;|…)(_[A-Za-z0-9]+_| )(, _[A-Za-z0-9]+_)* $/,
                // Example ( _foo_ [ , _bar_ ] )
                // Example ( [ _foo_ ] )
                /^ (\[ )?_[A-Za-z0-9]+_(, _[A-Za-z0-9]+_)*( \[ , _[A-Za-z0-9]+_(, _[A-Za-z0-9]+_)*)*( \])* $/,
            ].some(r => r.test(params));
        if (!paramsMatches) {
            const { line, column } = (0, utils_1.offsetToLineAndColumn)(contents, name.length);
            report({
                type: 'contents',
                ruleId,
                message: `expected parameter list to look like '( _a_ [ , _b_ ] )', '( _foo_, _bar_, ..._baz_ )', '( _foo_, … , _bar_ )', or '( . . . )'`,
                node: element,
                nodeRelativeLine: line,
                nodeRelativeColumn: column,
            });
        }
    }
}
exports.collectHeaderDiagnostics = collectHeaderDiagnostics;
//# sourceMappingURL=collect-header-diagnostics.js.map