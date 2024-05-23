"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectNodes = void 0;
function collectNodes(report, mainSource, spec, document) {
    const headers = [];
    const mainGrammar = [];
    const sdos = [];
    const earlyErrors = [];
    const algorithms = [];
    let failed = false;
    let inAnnexB = false;
    const lintWalker = document.createTreeWalker(document.body, 1 /* elements */);
    function visitCurrentNode() {
        const node = lintWalker.currentNode;
        const thisNodeIsAnnexB = node.nodeName === 'EMU-ANNEX' &&
            node.id === 'sec-additional-ecmascript-features-for-web-browsers';
        if (thisNodeIsAnnexB) {
            inAnnexB = true;
        }
        // Don't bother collecting early errors and SDOs from Annex B.
        // This is mostly so we don't have to deal with having two inconsistent copies of some of the grammar productions.
        if (!inAnnexB) {
            if (node.nodeName === 'EMU-CLAUSE') {
                // Look for early errors
                const first = node.firstElementChild;
                if (first !== null && first.nodeName === 'H1') {
                    const title = textContentExcludingDeleted(first);
                    headers.push({ element: first, contents: title });
                    if (title.trim() === 'Static Semantics: Early Errors') {
                        let grammar = null;
                        let lists = [];
                        let warned = false;
                        for (const child of node.children) {
                            if (child.nodeName === 'EMU-GRAMMAR') {
                                if (grammar !== null) {
                                    if (lists.length === 0) {
                                        spec.warn({
                                            type: 'node',
                                            node: grammar,
                                            ruleId: 'early-error-shape',
                                            message: 'unrecognized structure for early errors: multiple consecutive <emu-grammar>s without intervening <ul> of errors',
                                        });
                                        warned = true;
                                        break;
                                    }
                                    earlyErrors.push({ grammar, lists });
                                }
                                grammar = child;
                                lists = [];
                            }
                            else if (child.nodeName === 'UL') {
                                if (grammar === null) {
                                    spec.warn({
                                        type: 'node',
                                        node: child,
                                        ruleId: 'early-error-shape',
                                        message: 'unrecognized structure for early errors: <ul> without preceding <emu-grammar>',
                                    });
                                    warned = true;
                                    break;
                                }
                                lists.push(child);
                            }
                        }
                        if (grammar === null) {
                            if (!warned) {
                                spec.warn({
                                    type: 'node',
                                    node,
                                    ruleId: 'early-error-shape',
                                    message: 'unrecognized structure for early errors: no <emu-grammar>',
                                });
                            }
                        }
                        else if (lists.length === 0) {
                            if (!warned) {
                                spec.warn({
                                    type: 'node',
                                    node,
                                    ruleId: 'early-error-shape',
                                    message: 'unrecognized structure for early errors: no <ul> of errors',
                                });
                            }
                        }
                        else {
                            earlyErrors.push({ grammar, lists });
                        }
                    }
                }
            }
            else if (node.nodeName === 'EMU-GRAMMAR' && !node.hasAttribute('example')) {
                // Look for grammar definitions and SDOs
                if (node.getAttribute('type') === 'definition') {
                    const loc = spec.locate(node);
                    if (!loc)
                        return;
                    const { source: importSource } = loc;
                    if (loc.endTag == null) {
                        failed = true;
                        // we'll warn for this in collect-tag-diagnostics; no need to do so here
                    }
                    else {
                        const start = loc.startTag.endOffset;
                        const end = loc.endTag.startOffset;
                        const realSource = (importSource !== null && importSource !== void 0 ? importSource : mainSource).slice(start, end);
                        mainGrammar.push({ element: node, source: realSource });
                    }
                }
                else {
                    const next = lintWalker.nextSibling();
                    if (next) {
                        if (next.nodeName === 'EMU-ALG') {
                            sdos.push({ grammar: node, alg: next });
                        }
                        lintWalker.previousSibling();
                    }
                }
            }
        }
        if (node.nodeName === 'EMU-ALG' && !node.hasAttribute('example')) {
            algorithms.push({ element: node });
        }
        const firstChild = lintWalker.firstChild();
        if (firstChild) {
            while (true) {
                visitCurrentNode();
                const next = lintWalker.nextSibling();
                if (!next)
                    break;
            }
            lintWalker.parentNode();
        }
        if (thisNodeIsAnnexB) {
            inAnnexB = false;
        }
    }
    visitCurrentNode();
    if (failed) {
        return { success: false };
    }
    return { success: true, mainGrammar, headers, sdos, earlyErrors, algorithms };
}
exports.collectNodes = collectNodes;
function textContentExcludingDeleted(node) {
    let retval = '';
    node.childNodes.forEach(value => {
        if (value.nodeType === 3) {
            retval += value.nodeValue;
        }
        else if (value.nodeType !== 1 || value.tagName !== 'DEL') {
            retval += textContentExcludingDeleted(value);
        }
    });
    return retval;
}
//# sourceMappingURL=collect-nodes.js.map