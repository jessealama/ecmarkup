"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
const Clause_1 = require("./Clause");
const utils_1 = require("./utils");
const utils_2 = require("./lint/utils");
const emd = require("ecmarkdown");
function findLabeledSteps(root) {
    const steps = [];
    emd.visit(root, {
        enter(node) {
            if (node.name === 'ordered-list-item' && node.attrs.some(a => a.key === 'id')) {
                steps.push(node);
            }
        },
    });
    return steps;
}
const kindSelector = Clause_1.SPECIAL_KINDS.map(kind => `li[${kind}]`).join(',');
class Algorithm extends Builder_1.default {
    static async enter(context) {
        var _a;
        context.inAlg = true;
        const { spec, node, clauseStack } = context;
        let emdTree = null;
        let innerHTML;
        if ('ecmarkdownTree' in node) {
            emdTree = node.ecmarkdownTree;
            innerHTML = node.originalHtml;
        }
        else {
            const location = spec.locate(node);
            const source = (location === null || location === void 0 ? void 0 : location.source) == null || location.endTag == null
                ? node.innerHTML
                : location.source.slice(location.startTag.endOffset, location.endTag.startOffset);
            innerHTML = source;
            try {
                emdTree = emd.parseAlgorithm(source);
                node.ecmarkdownTree = emdTree;
                node.originalHtml = source;
            }
            catch (e) {
                (0, utils_1.warnEmdFailure)(spec.warn, node, e);
            }
        }
        if (emdTree == null) {
            node.innerHTML = (0, utils_1.wrapEmdFailure)(innerHTML);
            return;
        }
        if (spec.opts.lintSpec && spec.locate(node) != null && !node.hasAttribute('example')) {
            const clause = clauseStack[clauseStack.length - 1];
            const namespace = clause ? clause.namespace : spec.namespace;
            const nonterminals = (0, utils_2.collectNonterminalsFromEmd)(emdTree).map(({ name, loc }) => ({
                name,
                loc,
                node,
                namespace,
            }));
            spec._ntStringRefs = spec._ntStringRefs.concat(nonterminals);
            const returnType = (_a = clause === null || clause === void 0 ? void 0 : clause.signature) === null || _a === void 0 ? void 0 : _a.return;
            let containsAnyCompletionyThings = false;
            if ((returnType === null || returnType === void 0 ? void 0 : returnType.kind) != null) {
                function checkForCompletionyStuff(list) {
                    var _a;
                    for (const step of list.contents) {
                        if (step.contents[0].name === 'text' &&
                            /^(note|assert):/i.test(step.contents[0].contents)) {
                            continue;
                        }
                        if (step.contents.some(c => c.name === 'text' && /a new (\w+ )?Abstract Closure/i.test(c.contents))) {
                            continue;
                        }
                        for (const part of step.contents) {
                            if (part.name !== 'text') {
                                continue;
                            }
                            const completionyThing = part.contents.match(/\b(ReturnIfAbrupt\b|(^|(?<=, ))[tT]hrow (a\b|the\b|$)|[rR]eturn (Normal|Throw|Return)?Completion\(|[rR]eturn( a| a new| the)? Completion Record\b|the result of evaluating\b)|(?<=[\s(])\?\s/);
                            if (completionyThing != null) {
                                if ((returnType === null || returnType === void 0 ? void 0 : returnType.kind) === 'completion') {
                                    containsAnyCompletionyThings = true;
                                }
                                else {
                                    spec.warn({
                                        type: 'contents',
                                        ruleId: 'completiony-thing-in-non-completion-algorithm',
                                        message: 'this would return a Completion Record, but the containing AO is declared not to return a Completion Record',
                                        node,
                                        nodeRelativeLine: part.location.start.line,
                                        nodeRelativeColumn: part.location.start.column + completionyThing.index,
                                    });
                                }
                            }
                        }
                        if (((_a = step.sublist) === null || _a === void 0 ? void 0 : _a.name) === 'ol') {
                            checkForCompletionyStuff(step.sublist);
                        }
                    }
                }
                checkForCompletionyStuff(emdTree.contents);
                // TODO: remove 'GeneratorYield' when the spec is more coherent (https://github.com/tc39/ecma262/pull/2429)
                // TODO: remove SDOs after doing the work necessary to coordinate the `containsAnyCompletionyThings` bit across all the piecewise components of an SDO's definition
                if (!['Completion', 'GeneratorYield'].includes(clause.aoid) &&
                    (returnType === null || returnType === void 0 ? void 0 : returnType.kind) === 'completion' &&
                    !containsAnyCompletionyThings &&
                    !['sdo', 'internal method', 'concrete method'].includes(clause.type)) {
                    spec.warn({
                        type: 'node',
                        ruleId: 'completion-algorithm-lacks-completiony-thing',
                        message: 'this algorithm is declared as returning a Completion Record, but there is no step which might plausibly return an abrupt completion',
                        node,
                    });
                }
            }
        }
        const rawHtml = emd.emit(emdTree);
        // replace spaces after !/? with &nbsp; to prevent bad line breaking
        let html = rawHtml.replace(/((?:\s+|>)[!?])[ \t]+/g, '$1&nbsp;');
        // replace spaces before »/} with &nbsp; to prevent bad line breaking
        html = html.replace(/[ \t]+([»}])/g, '&nbsp;$1');
        node.innerHTML = html;
        const labeledStepEntries = [];
        const replaces = node.getAttribute('replaces-step');
        if (replaces) {
            context.spec.replacementAlgorithms.push({
                element: node,
                target: replaces,
            });
            context.spec.replacementAlgorithmToContainedLabeledStepEntries.set(node, labeledStepEntries);
        }
        if (replaces && node.firstElementChild.children.length > 1) {
            const labeledSteps = findLabeledSteps(emdTree);
            for (const step of labeledSteps) {
                const itemSource = innerHTML.slice(step.location.start.offset, step.location.end.offset);
                const offset = itemSource.match(/^.*?[ ,[]id *= *"/)[0].length;
                spec.warn({
                    type: 'contents',
                    ruleId: 'labeled-step-in-replacement',
                    message: 'labeling a step in a replacement algorithm which has multiple top-level steps is unsupported because the resulting step number would be ambiguous',
                    node,
                    nodeRelativeLine: step.location.start.line,
                    nodeRelativeColumn: step.location.start.column + offset,
                });
            }
        }
        for (const step of node.querySelectorAll('li[id]')) {
            const entry = {
                type: 'step',
                id: step.id,
                stepNumbers: getStepNumbers(step),
            };
            context.spec.biblio.add(entry);
            if (replaces) {
                // The biblio entries for labeled steps in replacement algorithms will be modified in-place by a subsequent pass
                labeledStepEntries.push(entry);
                context.spec.labeledStepsToBeRectified.add(step.id);
            }
        }
        for (const step of node.querySelectorAll(kindSelector)) {
            // prettier-ignore
            const attributes = Clause_1.SPECIAL_KINDS
                .filter(kind => step.hasAttribute(kind))
                .map(kind => Clause_1.SPECIAL_KINDS_MAP.get(kind));
            const tag = spec.doc.createElement('div');
            tag.className = 'attributes-tag';
            const text = attributes.join(', ');
            const contents = spec.doc.createTextNode(text);
            tag.append(contents);
            step.prepend(tag);
            // we've already walked past the text node, so it won't get picked up by the usual process for autolinking
            const clause = clauseStack[clauseStack.length - 1];
            if (clause != null) {
                // the `== null` case only happens if you put an algorithm at the top level of your document
                spec._textNodes[clause.namespace] = spec._textNodes[clause.namespace] || [];
                spec._textNodes[clause.namespace].push({
                    node: contents,
                    clause,
                    inAlg: true,
                    currentId: context.currentId,
                });
            }
        }
    }
    static exit(context) {
        context.inAlg = false;
    }
}
Algorithm.elements = ['EMU-ALG'];
exports.default = Algorithm;
function getStepNumbers(item) {
    var _a;
    const { indexOf } = Array.prototype;
    const counts = [];
    while (((_a = item.parentElement) === null || _a === void 0 ? void 0 : _a.tagName) === 'OL') {
        counts.unshift(1 + indexOf.call(item.parentElement.children, item));
        item = item.parentElement.parentElement;
    }
    return counts;
}
//# sourceMappingURL=Algorithm.js.map