"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ruleId = 'algorithm-step-labels';
/*
Checks that step labels all start with `step-`.
*/
function default_1(report, node, algorithmSource) {
    const idAttr = node.attrs.find(({ key }) => key === 'id');
    if (idAttr != null && !/^step-/.test(idAttr.value)) {
        const itemSource = algorithmSource.slice(idAttr.location.start.offset, idAttr.location.end.offset);
        const offset = itemSource.match(/^id *= *"/)[0].length;
        report({
            ruleId,
            line: idAttr.location.start.line,
            column: idAttr.location.start.column + offset,
            message: `step labels should start with "step-"`,
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=algorithm-step-labels.js.map