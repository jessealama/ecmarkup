"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectGrammarDiagnostics = void 0;
const grammarkdown_1 = require("grammarkdown");
const utils_1 = require("./utils");
async function collectGrammarDiagnostics(report, spec, mainSource, mainGrammar, sdos, earlyErrors) {
    // *******************
    // Parse the grammar with Grammarkdown and collect its diagnostics, if any
    var _a;
    const mainHost = new grammarkdown_1.CoreAsyncHost({
        ignoreCase: false,
        useBuiltinGrammars: false,
        resolveFile: file => file,
        readFile(file) {
            const idx = parseInt(file);
            if (idx.toString() !== file || idx < 0 || idx >= mainGrammar.length) {
                throw new Error('tried to read non-existent ' + file);
            }
            return mainGrammar[idx].source;
        },
    });
    const compilerOptions = {
        format: grammarkdown_1.EmitFormat.ecmarkup,
        noChecks: false,
        noUnusedParameters: true,
    };
    const grammar = new grammarkdown_1.Grammar(Object.keys(mainGrammar), compilerOptions, mainHost);
    await grammar.parse();
    await grammar.check();
    const unusedParameterErrors = new Map();
    if (grammar.diagnostics.size > 0) {
        // `detailedMessage: false` prevents prepending line numbers, which is good because we're going to make our own
        grammar.diagnostics
            .getDiagnosticInfos({ formatMessage: true, detailedMessage: false })
            .forEach(m => {
            var _a;
            const idx = +m.sourceFile.filename;
            const error = {
                type: 'contents',
                ruleId: `grammarkdown:${m.code}`,
                message: m.formattedMessage,
                node: mainGrammar[idx].element,
                nodeRelativeLine: m.range.start.line + 1,
                nodeRelativeColumn: m.range.start.character + 1,
            };
            if (m.code === grammarkdown_1.Diagnostics.Parameter_0_is_unused.code) {
                const param = m.node;
                const navigator = grammar.resolver.createNavigator(param);
                navigator.moveToAncestor(node => node.kind === grammarkdown_1.SyntaxKind.Production);
                const nodeName = navigator.getNode().name.text;
                const paramName = param.name.text;
                if (!unusedParameterErrors.has(nodeName)) {
                    unusedParameterErrors.set(nodeName, new Map());
                }
                const paramToError = unusedParameterErrors.get(nodeName);
                paramToError.set(paramName, error);
                return;
            }
            if (m.code === grammarkdown_1.Diagnostics.Cannot_find_name_0_.code &&
                spec.biblio.byProductionName((_a = m.messageArguments) === null || _a === void 0 ? void 0 : _a[0]) != null) {
                // grammarkdown assumes it has the whole grammar in scope
                // but some productions might be defined in an external biblio
                // TODO: thread the actual grammar through to grammarkdown so it has appropriate context, instead of surpressing this error
                return;
            }
            report(error);
        });
    }
    // *******************
    // Check that SDOs and Early Errors are defined in terms of productions which actually exist
    // Also filter out any "unused parameter" warnings for grammar productions for which the parameter is used in an early error or SDO
    const oneOffGrammars = [];
    const actualGrammarProductions = (0, utils_1.getProductions)(grammar.rootFiles);
    const grammarsAndRules = [
        ...sdos.map(s => ({ grammar: s.grammar, rules: [s.alg], type: 'syntax-directed operation' })),
        ...earlyErrors.map(e => ({ grammar: e.grammar, rules: e.lists, type: 'early error' })),
    ];
    for (const { grammar: grammarEle, rules: rulesEles, type } of grammarsAndRules) {
        const grammarLoc = spec.locate(grammarEle);
        if (!grammarLoc)
            continue;
        const { source: importSource } = grammarLoc;
        if (grammarLoc.endTag == null) {
            // we'll warn for this in collect-tag-diagnostics; no need to do so here
            continue;
        }
        const grammarHost = grammarkdown_1.CoreAsyncHost.forFile((importSource !== null && importSource !== void 0 ? importSource : mainSource).slice(grammarLoc.startTag.endOffset, grammarLoc.endTag.startOffset));
        const grammar = new grammarkdown_1.Grammar([grammarHost.file], { format: grammarkdown_1.EmitFormat.ecmarkup, noChecks: true }, grammarHost);
        await grammar.parse();
        oneOffGrammars.push({ grammarEle, grammar });
        const productions = (0, utils_1.getProductions)(grammar.sourceFiles);
        for (const [name, { production, rhses }] of productions) {
            const originalRhses = (_a = actualGrammarProductions.get(name)) === null || _a === void 0 ? void 0 : _a.rhses;
            if (originalRhses === undefined) {
                if (spec.biblio.byProductionName(name) != null) {
                    // in an ideal world we'd keep the full grammar in the biblio so we could check for a matching RHS, not just a matching LHS
                    // but, we're not in that world
                    // https://github.com/tc39/ecmarkup/issues/431
                    continue;
                }
                const { line, column } = (0, utils_1.getLocationInGrammarFile)(grammar.sourceFiles[0], production.pos);
                report({
                    type: 'contents',
                    ruleId: 'undefined-nonterminal',
                    message: `Could not find a definition for LHS in ${type}`,
                    node: grammarEle,
                    nodeRelativeLine: line,
                    nodeRelativeColumn: column,
                });
                continue;
            }
            for (const rhs of rhses) {
                if (!originalRhses.some(o => (0, utils_1.rhsMatches)(rhs, o))) {
                    const { line, column } = (0, utils_1.getLocationInGrammarFile)(grammar.sourceFiles[0], rhs.pos);
                    report({
                        type: 'contents',
                        ruleId: 'undefined-nonterminal',
                        message: `Could not find a production matching RHS in ${type}`,
                        node: grammarEle,
                        nodeRelativeLine: line,
                        nodeRelativeColumn: column,
                    });
                }
                if (rhs.kind === grammarkdown_1.SyntaxKind.RightHandSide) {
                    (function noGrammarRestrictions(s) {
                        if (s === undefined) {
                            return;
                        }
                        if (s.symbol.kind === grammarkdown_1.SyntaxKind.NoSymbolHereAssertion) {
                            const { line, column } = (0, utils_1.getLocationInGrammarFile)(grammar.sourceFiles[0], s.symbol.pos);
                            report({
                                type: 'contents',
                                ruleId: `NLTH-in-SDO`,
                                message: `Productions referenced in ${type}s should not include "no LineTerminator here" restrictions`,
                                node: grammarEle,
                                nodeRelativeLine: line,
                                nodeRelativeColumn: column,
                            });
                        }
                        // We could also enforce that lookahead restrictions are absent, but in some cases they actually do add clarity, so we just don't enforce it either way.
                        noGrammarRestrictions(s.next);
                    })(rhs.head);
                    if (rhs.constraints !== undefined) {
                        const { line, column } = (0, utils_1.getLocationInGrammarFile)(grammar.sourceFiles[0], rhs.constraints.pos);
                        report({
                            type: 'contents',
                            ruleId: `guard-in-SDO`,
                            message: `productions referenced in ${type}s should not be gated on grammar parameters`,
                            node: grammarEle,
                            nodeRelativeLine: line,
                            nodeRelativeColumn: column,
                        });
                    }
                }
            }
            // Filter out unused parameter errors for which the parameter is actually used in an SDO or Early Error
            if (unusedParameterErrors.has(name)) {
                const paramToError = unusedParameterErrors.get(name);
                for (const paramName of paramToError.keys()) {
                    // This isn't the most elegant check, but it works.
                    if (rulesEles.some(r => r.innerHTML.indexOf('[' + paramName + ']') !== -1)) {
                        paramToError.delete(paramName);
                    }
                }
            }
        }
    }
    for (const paramToError of unusedParameterErrors.values()) {
        for (const error of paramToError.values()) {
            report(error);
        }
    }
    return {
        grammar,
        oneOffGrammars,
    };
}
exports.collectGrammarDiagnostics = collectGrammarDiagnostics;
//# sourceMappingURL=collect-grammar-diagnostics.js.map