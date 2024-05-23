"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
const utils_1 = require("./utils");
const Spec_1 = require("./Spec");
class Meta extends Builder_1.default {
    static async enter({ spec, node, clauseStack }) {
        const parent = clauseStack[clauseStack.length - 1] || null;
        if (node.hasAttribute('effects') && parent !== null) {
            const effects = (0, utils_1.validateEffects)(spec, node
                .getAttribute('effects')
                .split(',')
                .map(e => e.trim()), node);
            for (const effect of effects) {
                if (!(0, utils_1.doesEffectPropagateToParent)(node, effect)) {
                    continue;
                }
                if (!spec._effectWorklist.has(effect)) {
                    spec._effectWorklist.set(effect, []);
                }
                (0, Spec_1.maybeAddClauseToEffectWorklist)(effect, parent, spec._effectWorklist.get(effect));
            }
        }
        spec._emuMetasToRender.add(node);
    }
    static render(spec, node) {
        // This builder turns <emu-meta> tags that aren't removed during effect
        // propagation on invocations into <span>s so they are rendered.
        if (node.hasAttribute('effects') && spec.opts.markEffects) {
            const classNames = node
                .getAttribute('effects')
                .split(',')
                .map(e => e.trim())
                .map(e => `e-${e}`)
                .join(' ');
            const span = spec.doc.createElement('span');
            span.setAttribute('class', classNames);
            while (node.firstChild) {
                span.appendChild(node.firstChild);
            }
            node.replaceWith(span);
        }
        else {
            // Nothing to render, strip it.
            node.replaceWith(...node.childNodes);
        }
    }
}
Meta.elements = ['EMU-META'];
exports.default = Meta;
//# sourceMappingURL=Meta.js.map