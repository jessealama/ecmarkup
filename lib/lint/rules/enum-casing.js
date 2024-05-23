"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const ruleId = 'enum-casing';
/*
Checks that ~enum-values~ are kebab-cased.
*/
function default_1(report, step, algorithmSource) {
    for (const item of step.contents) {
        if (item.name !== 'tilde' || item.contents.length !== 1 || item.contents[0].name !== 'text') {
            continue;
        }
        const text = item.contents[0];
        if (/[\p{Uppercase_Letter}\s]/u.test(text.contents)) {
            const location = (0, utils_1.offsetToLineAndColumn)(algorithmSource, text.location.start.offset);
            report({
                ruleId,
                message: 'enum values should be lowercase and kebab-cased',
                ...location,
            });
        }
    }
}
exports.default = default_1;
//# sourceMappingURL=enum-casing.js.map