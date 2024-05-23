"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const ruleId = 'if-else-consistency';
/*
Checks that `if`/`else` statements are both single-line or both multi-line.
*/
function default_1(report, step, algorithmSource, parsedSteps, parent) {
    const stepSeq = parsedSteps.get(step);
    if (stepSeq == null) {
        return;
    }
    const firstSeqItem = stepSeq.items[0];
    if ((firstSeqItem === null || firstSeqItem === void 0 ? void 0 : firstSeqItem.name) !== 'text' || !/^(?:If|Else if)\b/.test(firstSeqItem.contents)) {
        return;
    }
    const idx = parent.contents.indexOf(step);
    if (idx >= parent.contents.length - 1) {
        return;
    }
    const nextStep = parent.contents[idx + 1];
    const nextSeq = parsedSteps.get(nextStep);
    if (nextSeq == null) {
        return;
    }
    const nextFirstSeqitem = nextSeq.items[0];
    if ((nextFirstSeqitem === null || nextFirstSeqitem === void 0 ? void 0 : nextFirstSeqitem.name) !== 'text' ||
        !/^(?:Else|Otherwise)\b/.test(nextFirstSeqitem.contents)) {
        return;
    }
    if (step.sublist != null && nextStep.sublist == null) {
        const location = (0, utils_1.offsetToLineAndColumn)(algorithmSource, nextFirstSeqitem.location.start.offset);
        report({
            ruleId,
            ...location,
            message: '"Else" steps should be multiline whenever their corresponding "If" is',
        });
    }
    else if (step.sublist == null && nextStep.sublist != null) {
        const location = (0, utils_1.offsetToLineAndColumn)(algorithmSource, firstSeqItem.location.start.offset);
        report({
            ruleId,
            ...location,
            message: '"If" steps should be multiline whenever their corresponding "Else" is',
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=if-else-consistency.js.map