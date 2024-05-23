"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectAlgorithmDiagnostics = void 0;
const ecmarkdown_1 = require("ecmarkdown");
const utils_1 = require("../utils");
const algorithm_line_style_1 = require("./rules/algorithm-line-style");
const algorithm_step_numbering_1 = require("./rules/algorithm-step-numbering");
const algorithm_step_labels_1 = require("./rules/algorithm-step-labels");
const enum_casing_1 = require("./rules/enum-casing");
const for_each_element_1 = require("./rules/for-each-element");
const step_attributes_1 = require("./rules/step-attributes");
const if_else_consistency_1 = require("./rules/if-else-consistency");
const variable_use_def_1 = require("./rules/variable-use-def");
const expr_parser_1 = require("../expr-parser");
const stepRules = [
    algorithm_line_style_1.default,
    algorithm_step_numbering_1.default,
    algorithm_step_labels_1.default,
    enum_casing_1.default,
    for_each_element_1.default,
    step_attributes_1.default,
    if_else_consistency_1.default,
];
function collectAlgorithmDiagnostics(report, spec, mainSource, algorithms) {
    for (const algorithm of algorithms) {
        const element = algorithm.element;
        const location = spec.locate(element);
        if (!location)
            continue;
        const { source: importSource } = location;
        if (location.endTag == null) {
            // we'll warn for this in collect-tag-diagnostics; no need to do so here
            continue;
        }
        // TODO this wrapper is maybe not necessary
        const reporter = ({ ruleId, message, line, column }) => {
            report({
                type: 'contents',
                ruleId,
                message,
                node: element,
                nodeRelativeLine: line,
                nodeRelativeColumn: column,
            });
        };
        const algorithmSource = (importSource !== null && importSource !== void 0 ? importSource : mainSource).slice(location.startTag.endOffset, location.endTag.startOffset);
        algorithm.source = algorithmSource;
        let tree;
        try {
            tree = (0, ecmarkdown_1.parseAlgorithm)(algorithmSource);
        }
        catch (e) {
            (0, utils_1.warnEmdFailure)(report, element, e);
        }
        const parsedSteps = new Map();
        let allNodesParsedSuccessfully = true;
        function parseStep(step) {
            var _a;
            const parsed = (0, expr_parser_1.parse)(step.contents, new Set());
            if (parsed.name === 'failure') {
                allNodesParsedSuccessfully = false;
            }
            else {
                parsedSteps.set(step, parsed);
            }
            if (((_a = step.sublist) === null || _a === void 0 ? void 0 : _a.name) === 'ol') {
                for (const substep of step.sublist.contents) {
                    parseStep(substep);
                }
            }
        }
        function applyRule(visit, step, parent) {
            var _a;
            // we don't know the names of ops at this point
            // TODO maybe run later in the process? but not worth worrying about for now
            visit(reporter, step, algorithmSource, parsedSteps, parent);
            if (((_a = step.sublist) === null || _a === void 0 ? void 0 : _a.name) === 'ol') {
                for (const substep of step.sublist.contents) {
                    applyRule(visit, substep, step.sublist);
                }
            }
        }
        if (tree != null && !element.hasAttribute('example')) {
            for (const step of tree.contents.contents) {
                parseStep(step);
            }
            for (const rule of stepRules) {
                for (const step of tree.contents.contents) {
                    applyRule(rule, step, tree.contents);
                }
            }
            if (allNodesParsedSuccessfully) {
                (0, variable_use_def_1.checkVariableUsage)(algorithmSource, algorithm.element, tree.contents, parsedSteps, reporter);
            }
        }
        algorithm.tree = tree;
    }
}
exports.collectAlgorithmDiagnostics = collectAlgorithmDiagnostics;
//# sourceMappingURL=collect-algorithm-diagnostics.js.map