"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
class H1 extends Builder_1.default {
    static async enter() {
        // do nothing
    }
    static async exit({ spec, node, clauseStack }) {
        const parent = clauseStack[clauseStack.length - 1] || null;
        if (parent === null || parent.header !== node) {
            return;
        }
        const headerClone = node.cloneNode(true);
        for (const a of headerClone.querySelectorAll('a')) {
            a.replaceWith(...a.childNodes);
        }
        parent.titleHTML = headerClone.innerHTML;
        parent.title = headerClone.textContent;
        if (parent.number) {
            const numElem = spec.doc.createElement('span');
            numElem.setAttribute('class', 'secnum');
            numElem.textContent = parent.number;
            node.insertBefore(spec.doc.createTextNode(' '), node.firstChild);
            node.insertBefore(numElem, node.firstChild);
        }
    }
}
H1.elements = ['H1'];
exports.default = H1;
//# sourceMappingURL=H1.js.map