"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.build = exports.Boilerplate = void 0;
const Spec_1 = require("./Spec");
const utils = require("./utils");
const prex_1 = require("prex");
class Boilerplate {
}
exports.Boilerplate = Boilerplate;
async function build(path, fetch, opts, token = prex_1.CancellationToken.none) {
    const html = await fetch(path, token);
    const dom = utils.htmlToDom(html);
    const spec = new Spec_1.default(path, fetch, dom, opts !== null && opts !== void 0 ? opts : {}, /*sourceText*/ html, token);
    await spec.build();
    return spec;
}
exports.build = build;
//# sourceMappingURL=ecmarkup.js.map