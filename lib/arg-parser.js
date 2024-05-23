"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
const commandLineArgs = require("command-line-args");
function fail(msg) {
    console.error(msg);
    process.exit(1);
}
function parse(options, printHelp) {
    const def = options.find(o => o.defaultOption);
    if (!(def === null || def === void 0 ? void 0 : def.multiple)) {
        // this is just so I don't have to think about how to handle `--` in other cases
        // not an inherent limitation
        throw new Error('ecmarkup arg-parser requires a default option for now');
    }
    const argv = process.argv.slice(2);
    let notParsed = [];
    const dashDashIndex = argv.indexOf('--');
    if (dashDashIndex !== -1) {
        notParsed = argv.splice(dashDashIndex + 1);
        argv.pop();
    }
    let args;
    try {
        // @ts-ignore the types are wrong about mutability
        args = commandLineArgs(options, { argv });
    }
    catch (e) {
        if ((e === null || e === void 0 ? void 0 : e.name) === 'UNKNOWN_OPTION') {
            fail(`Unknown option ${e.optionName}`);
        }
        throw e;
    }
    // @ts-ignore it's fine
    args[def.name] = (args[def.name] || []).concat(notParsed);
    if (args.help ||
        (argv.length === 0 && notParsed.length === 0)) {
        printHelp();
        process.exit(0);
    }
    return args;
}
exports.parse = parse;
//# sourceMappingURL=arg-parser.js.map