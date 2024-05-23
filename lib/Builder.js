"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Builder {
    constructor(spec, node) {
        this.spec = spec;
        this.node = node;
        const nodeId = node.getAttribute('id');
        if (nodeId !== null) {
            if (spec.nodeIds.has(nodeId)) {
                spec.warn({
                    type: 'attr-value',
                    attr: 'id',
                    ruleId: 'duplicate-id',
                    message: `<${node.tagName.toLowerCase()}> has duplicate id ${JSON.stringify(nodeId)}`,
                    node,
                });
            }
            spec.nodeIds.add(nodeId);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static async enter(context) {
        throw new Error('Builder not implemented');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static exit(context) { }
}
Builder.elements = [];
exports.default = Builder;
//# sourceMappingURL=Builder.js.map