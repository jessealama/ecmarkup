"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ruleId = 'for-each-element';
/*
Checks that "For each" loops name a type or say "element" before the variable.
*/
function default_1(report, step, algorithmSource, parsedSteps) {
    const stepSeq = parsedSteps.get(step);
    if (stepSeq == null || stepSeq.items.length < 2) {
        return;
    }
    const [first, second] = stepSeq.items;
    if (first.name === 'text' && first.contents === 'For each ' && second.name === 'underscore') {
        report({
            ruleId,
            line: second.location.start.line,
            column: second.location.start.column,
            message: 'expected "for each" to have a type name or "element" before the loop variable',
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=for-each-element.js.map