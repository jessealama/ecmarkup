"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Clause_1 = require("../../Clause");
const ruleId = 'step-attribute';
const KNOWN_ATTRIBUTES = ['id', 'fence-effects', 'declared', ...Clause_1.SPECIAL_KINDS];
/*
Checks for unknown attributes on steps.
*/
function default_1(report, node) {
    for (const attr of node.attrs) {
        if (!KNOWN_ATTRIBUTES.includes(attr.key)) {
            report({
                ruleId,
                message: `unknown step attribute ${JSON.stringify(attr.key)}`,
                line: attr.location.start.line,
                column: attr.location.start.column,
            });
        }
        else if (attr.value !== '' && Clause_1.SPECIAL_KINDS.includes(attr.key)) {
            report({
                ruleId,
                message: `step attribute ${JSON.stringify(attr.key)} should not have a value`,
                line: attr.location.start.line,
                column: attr.location.start.column + attr.key.length + 2, // ="
            });
        }
    }
}
exports.default = default_1;
//# sourceMappingURL=step-attributes.js.map