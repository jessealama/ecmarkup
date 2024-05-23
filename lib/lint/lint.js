"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lint = void 0;
const collect_nodes_1 = require("./collect-nodes");
const collect_grammar_diagnostics_1 = require("./collect-grammar-diagnostics");
const collect_spelling_diagnostics_1 = require("./collect-spelling-diagnostics");
const collect_algorithm_diagnostics_1 = require("./collect-algorithm-diagnostics");
const collect_header_diagnostics_1 = require("./collect-header-diagnostics");
const collect_tag_diagnostics_1 = require("./collect-tag-diagnostics");
/*
Currently this checks
- grammarkdown's built-in sanity checks
- the productions in the definition of each early error and SDO are defined in the main grammar
- those productions do not include `[no LineTerminator here]` restrictions or `[+flag]` gating
- the algorithm linting rules imported above
- headers of abstract operations have consistent spacing
- certain common spelling errors

There's more to do:
https://github.com/tc39/ecmarkup/issues/173
*/
async function lint(report, sourceText, spec, document) {
    var _a, _b;
    (0, collect_spelling_diagnostics_1.collectSpellingDiagnostics)(report, sourceText, spec.imports);
    (0, collect_tag_diagnostics_1.collectTagDiagnostics)(report, spec, document);
    const collection = (0, collect_nodes_1.collectNodes)(report, sourceText, spec, document);
    if (!collection.success) {
        return;
    }
    const { mainGrammar, headers, sdos, earlyErrors, algorithms } = collection;
    const { grammar, oneOffGrammars } = await (0, collect_grammar_diagnostics_1.collectGrammarDiagnostics)(report, spec, sourceText, mainGrammar, sdos, earlyErrors);
    (0, collect_algorithm_diagnostics_1.collectAlgorithmDiagnostics)(report, spec, sourceText, algorithms);
    (0, collect_header_diagnostics_1.collectHeaderDiagnostics)(report, headers);
    // Stash intermediate results for later use
    // This isn't actually necessary for linting, but we might as well avoid redoing work later when we can.
    await grammar.emit(undefined, (file, source) => {
        const name = +file.split('.')[0];
        const node = mainGrammar[name].element;
        if ('grammarkdownOut' in node) {
            throw new Error('unexpectedly regenerating grammarkdown output for node ' + name);
        }
        if (name !== +grammar.sourceFiles[name].filename) {
            throw new Error(`grammarkdown file mismatch: ${name} vs ${grammar.sourceFiles[name].filename}. This is a bug in ecmarkup; please report it.`);
        }
        node.grammarkdownOut = source;
        node.grammarSource = grammar.sourceFiles[name];
    });
    for (const { grammarEle, grammar } of oneOffGrammars) {
        await grammar.emit(undefined, (file, source) => {
            if ('grammarkdownOut' in grammarEle) {
                throw new Error('unexpectedly regenerating grammarkdown output');
            }
            if (grammar.rootFiles.length !== 1) {
                throw new Error(`grammarkdown file count mismatch: ${grammar.rootFiles.length}. This is a bug in ecmarkup; please report it.`);
            }
            grammarEle.grammarkdownOut = source;
            grammarEle.grammarSource = grammar.rootFiles[0];
        });
    }
    for (const pair of algorithms) {
        if ('tree' in pair) {
            const element = pair.element;
            element.ecmarkdownTree = (_a = pair.tree) !== null && _a !== void 0 ? _a : null;
            element.originalHtml = (_b = pair.source) !== null && _b !== void 0 ? _b : pair.element.innerHTML;
        }
    }
}
exports.lint = lint;
//# sourceMappingURL=lint.js.map