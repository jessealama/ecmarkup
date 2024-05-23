"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
class RHS extends Builder_1.default {
    constructor(spec, prod, node) {
        super(spec, node);
        this.production = prod;
        this.node = node;
        this.constraints = node.getAttribute('constraints');
        this.alternativeId = node.getAttribute('a');
    }
    build() {
        if (this.node.textContent === '') {
            this.node.textContent = '[empty]';
            return;
        }
        if (this.constraints) {
            const cs = this.spec.doc.createElement('emu-constraints');
            cs.textContent = '[' + this.constraints + ']';
            this.node.insertBefore(cs, this.node.childNodes[0]);
        }
        this.terminalify(this.node);
    }
    terminalify(parentNode) {
        var _a;
        // we store effects to perform later so the iteration doesn't get messed up
        const surrogateTags = ['INS', 'DEL', 'MARK'];
        const pairs = [];
        for (const node of parentNode.childNodes) {
            if (node.nodeType === 3) {
                pairs.push({ parent: parentNode, child: node });
            }
            else if (surrogateTags.includes(node.nodeName)) {
                for (const child of node.childNodes) {
                    if (child.nodeType === 3) {
                        pairs.push({ parent: node, child: child });
                    }
                }
            }
        }
        let first = true;
        for (const { parent, child } of pairs) {
            if (!first && !/^\s+$/.test((_a = child.textContent) !== null && _a !== void 0 ? _a : '')) {
                if (parent === parentNode) {
                    parentNode.insertBefore(this.spec.doc.createTextNode(' '), child);
                }
                else {
                    // put the space outside of `<ins>` (etc) tags
                    parentNode.insertBefore(this.spec.doc.createTextNode(' '), parent);
                }
            }
            first = false;
            this.wrapTerminal(parent, child);
        }
    }
    wrapTerminal(parentNode, node) {
        const textContent = node.textContent;
        const text = textContent.trim();
        if (text === '' && textContent.length > 0) {
            // preserve intermediate whitespace
            return;
        }
        const pieces = text.split(/\s/);
        let first = true;
        pieces.forEach(p => {
            if (p.length === 0) {
                return;
            }
            const est = this.spec.doc.createElement('emu-t');
            est.textContent = p;
            parentNode.insertBefore(est, node);
            if (!first) {
                parentNode.insertBefore(this.spec.doc.createTextNode(' '), est);
            }
            first = false;
        });
        parentNode.removeChild(node);
    }
}
exports.default = RHS;
//# sourceMappingURL=RHS.js.map