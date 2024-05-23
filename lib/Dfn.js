"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Biblio_1 = require("./Biblio");
const Builder_1 = require("./Builder");
class Dfn extends Builder_1.default {
    static async enter({ spec, node, clauseStack }) {
        if (!node.hasAttribute('tabindex')) {
            node.setAttribute('tabindex', '-1');
        }
        const parentClause = clauseStack[clauseStack.length - 1];
        if (!parentClause)
            return;
        const entry = {
            type: 'term',
            term: node.textContent,
            refId: parentClause.id,
        };
        if (node.hasAttribute('id')) {
            entry.id = node.id;
        }
        if (node.hasAttribute('variants')) {
            entry.variants = node
                .getAttribute('variants')
                .split(',')
                .map(v => v.trim());
        }
        const keys = (0, Biblio_1.getKeys)(entry);
        const existing = spec.biblio.keysForNamespace(parentClause.namespace);
        for (const [index, key] of keys.entries()) {
            if (keys.indexOf(key) !== index) {
                spec.warn({
                    type: 'node',
                    node,
                    ruleId: 'duplicate-definition',
                    message: `${JSON.stringify(key)} is defined more than once in this definition`,
                });
            }
            if (existing.has(key)) {
                spec.warn({
                    type: 'node',
                    node,
                    ruleId: 'duplicate-definition',
                    message: `duplicate definition ${JSON.stringify(key)}`,
                });
            }
        }
        spec.biblio.add(entry, parentClause.namespace);
    }
}
Dfn.elements = ['DFN'];
exports.default = Dfn;
//# sourceMappingURL=Dfn.js.map