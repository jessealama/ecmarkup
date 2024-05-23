"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectTagDiagnostics = void 0;
const knownEmuTags = new Set([
    'emu-meta',
    'emu-import',
    'emu-example',
    'emu-intro',
    'emu-clause',
    'emu-annex',
    'emu-biblio',
    'emu-xref',
    'emu-prodref',
    'emu-not-ref',
    'emu-note',
    'emu-eqn',
    'emu-table',
    'emu-figure',
    'emu-caption',
    'emu-grammar',
    'emu-alg',
    'emu-var',
    'emu-val',
    'emu-production',
    'emu-rhs',
    'emu-nt',
    'emu-t',
    'emu-gann',
    'emu-gprose',
    'emu-gmod',
    'emu-normative-optional', // used in ecma-402
]);
// https://html.spec.whatwg.org/multipage/syntax.html#void-elements
const voidElements = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);
function collectTagDiagnostics(report, spec, document) {
    const lintWalker = document.createTreeWalker(document.body, 1 /* elements */);
    function visit() {
        const node = lintWalker.currentNode;
        const name = node.tagName.toLowerCase();
        if (name.startsWith('emu-') && !knownEmuTags.has(name)) {
            report({
                type: 'node',
                ruleId: 'valid-tags',
                message: `unknown "emu-" tag "${name}"`,
                node,
            });
        }
        if (node.hasAttribute('oldid')) {
            report({
                type: 'attr',
                attr: 'oldid',
                ruleId: 'valid-tags',
                message: `"oldid" isn't a thing; did you mean "oldids"?`,
                node,
            });
        }
        if (!voidElements.has(name)) {
            const location = spec.locate(node);
            if (location != null && location.endTag == null) {
                report({
                    type: 'node',
                    ruleId: 'missing-closing-tag',
                    message: `element <${name}> is missing its closing tag`,
                    node,
                });
            }
        }
        const firstChild = lintWalker.firstChild();
        if (firstChild) {
            while (true) {
                visit();
                const next = lintWalker.nextSibling();
                if (!next)
                    break;
            }
            lintWalker.parentNode();
        }
    }
    visit();
}
exports.collectTagDiagnostics = collectTagDiagnostics;
//# sourceMappingURL=collect-tag-diagnostics.js.map