"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ruleId = 'algorithm-step-numbering';
/*
Checks that step numbers are all `1`.
*/
function default_1(report, node, algorithmSource) {
    const itemSource = algorithmSource.slice(node.location.start.offset, node.location.end.offset);
    const match = itemSource.match(/^(\s*)(\d+\.) /);
    if (match[2] !== '1.') {
        report({
            ruleId,
            line: node.location.start.line,
            column: node.location.start.column + match[1].length,
            message: `expected step number to be "1." (found ${JSON.stringify(match[2])})`,
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=algorithm-step-numbering.js.map