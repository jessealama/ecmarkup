"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandLineUsage = require("command-line-usage");
const path = require("path");
const fs = require("fs");
const ecmarkup = require("./ecmarkup");
const utils = require("./utils");
const args_1 = require("./args");
const arg_parser_1 = require("./arg-parser");
const debounce = require('promise-debounce');
function usage() {
    console.log(commandLineUsage([
        {
            header: 'ecmarkup',
            content: 'Compile ecmarkup documents to html.',
        },
        {
            header: 'Usage',
            content: ['ecmarkup in.emu out.html', 'ecmarkup --multipage in.emu out/'],
        },
        {
            header: 'Options',
            hide: ['files', 'js-out', 'css-out'],
            optionList: args_1.options,
        },
    ]));
}
function fail(msg) {
    console.error(msg);
    process.exit(1);
}
const args = (0, arg_parser_1.parse)(args_1.options, usage);
if (args.version) {
    const p = require(path.resolve(__dirname, '..', 'package.json'));
    console.log(`ecmarkup v${p.version}`);
    process.exit(0);
}
for (const [key, value] of Object.entries(args)) {
    if (value === null) {
        fail(`--${key} requires an argument`);
    }
}
if (args.files.length < 1) {
    fail('You must specify an input file');
}
if (args.files.length > 2) {
    fail('Found extra argument ' + args.files[2]);
}
const infile = args.files[0];
const outfile = args.files[1];
if (args.strict && args.watch) {
    fail('Cannot use --strict with --watch');
}
if (args['js-out'] || args['css-out']) {
    fail('--js-out and --css-out have been removed; specify --assets-dir instead');
}
if (args.assets != null && !['none', 'inline', 'external'].includes(args.assets)) {
    fail('--assets must be "none", "inline", or "external"');
}
if (args.assets != null && args.assets !== 'external' && args['assets-dir'] != null) {
    fail(`--assets=${args.assets} cannot be used --assets-dir"`);
}
if (args.multipage) {
    if (args.assets != null && !['none', 'inline'].includes(args.assets)) {
        fail('--multipage implies --assets=external');
    }
    if (!outfile) {
        fail('When using --multipage you must specify an output directory');
    }
    if (fs.existsSync(outfile) && !fs.lstatSync(outfile).isDirectory()) {
        fail('When using --multipage, outfile (' + outfile + ') must be a directory');
    }
    fs.mkdirSync(path.resolve(outfile, 'multipage'), { recursive: true });
}
const LOOKS_LIKE_FILE_REGEX = /^\.{0,2}\//;
const watching = new Map();
const build = debounce(async function build() {
    var _a;
    try {
        const opts = {
            multipage: args.multipage,
            outfile,
            extraBiblios: [],
            lintSpec: !!args['lint-spec'],
        };
        if (args.verbose) {
            opts.log = utils.logVerbose;
        }
        if (args['mark-effects']) {
            opts.markEffects = true;
        }
        if (args['no-toc'] != null) {
            opts.toc = !args['no-toc'];
        }
        if (args['old-toc'] != null) {
            opts.oldToc = args['old-toc'];
        }
        if (args.assets != null) {
            opts.assets = args.assets;
        }
        if (args['assets-dir'] != null) {
            opts.assetsDir = args['assets-dir'];
        }
        let warned = false;
        for (let toResolve of (_a = args['load-biblio']) !== null && _a !== void 0 ? _a : []) {
            if (LOOKS_LIKE_FILE_REGEX.test(toResolve)) {
                toResolve = path.resolve(process.cwd(), toResolve);
            }
            try {
                const bib = require(toResolve);
                if (Array.isArray(bib)) {
                    opts.extraBiblios.push(...bib);
                }
                else {
                    opts.extraBiblios.push(bib);
                }
            }
            catch (e) {
                fail(`could not find biblio ${toResolve}`);
            }
        }
        const errorFormatter = args['error-formatter'];
        let toResolve = errorFormatter;
        if (LOOKS_LIKE_FILE_REGEX.test(errorFormatter)) {
            toResolve = path.resolve(process.cwd(), errorFormatter);
        }
        let formatter;
        try {
            formatter = require(toResolve);
        }
        catch (e) {
            fail(`could not find formatter ${errorFormatter}`);
        }
        const warnings = [];
        opts.warn = err => {
            var _a;
            warned = true;
            const file = normalizePath((_a = err.file) !== null && _a !== void 0 ? _a : args.files[0]);
            // prettier-ignore
            const message = `${args.strict ? 'Error' : 'Warning'}: ${file}:${err.line == null ? '' : `${err.line}:${err.column}:`} ${err.message}`;
            utils.logWarning(message);
            warnings.push(err);
        };
        // Respect a reproducible build timestamp.
        // https://reproducible-builds.org/specs/source-date-epoch/
        if (process.env.SOURCE_DATE_EPOCH) {
            const sde = process.env.SOURCE_DATE_EPOCH.trim();
            if (!/^[0-9]+$/.test(sde)) {
                fail(`SOURCE_DATE_EPOCH value ${sde} is not valid`);
            }
            const ts = +sde;
            opts.date = new Date(ts * 1000);
        }
        const spec = await ecmarkup.build(args.files[0], utils.readFile, opts);
        if (args.verbose) {
            utils.logVerbose(warned ? 'Completed with errors.' : 'Done.');
        }
        const pending = [];
        if (args['write-biblio']) {
            if (args.verbose) {
                utils.logVerbose('Writing biblio file to ' + args['write-biblio']);
            }
            const exported = spec.exportBiblio();
            if (exported != null) {
                pending.push(utils.writeFile(args['write-biblio'], JSON.stringify(exported)));
            }
        }
        if (args.verbose && warned) {
            warnings.sort((a, b) => {
                var _a, _b;
                const aPath = normalizePath((_a = a.file) !== null && _a !== void 0 ? _a : infile);
                const bPath = normalizePath((_b = a.file) !== null && _b !== void 0 ? _b : infile);
                if (aPath !== bPath) {
                    return aPath.localeCompare(bPath);
                }
                if (a.line === b.line) {
                    if (a.column === b.column) {
                        return 0;
                    }
                    if (a.column == null) {
                        return -1;
                    }
                    if (b.column == null) {
                        return 1;
                    }
                    return a.column - b.column;
                }
                if (a.line == null) {
                    return -1;
                }
                if (b.line == null) {
                    return 1;
                }
                return a.line - b.line;
            });
            const results = warnings.map(err => {
                var _a;
                return ({
                    filePath: normalizePath((_a = err.file) !== null && _a !== void 0 ? _a : infile),
                    messages: [{ severity: args.strict ? 2 : 1, ...err }],
                    errorCount: args.strict ? 1 : 0,
                    warningCount: args.strict ? 0 : 1,
                    // for now, nothing is fixable
                    fixableErrorCount: 0,
                    fixableWarningCount: 0,
                    source: err.source,
                });
            });
            console.error(formatter(results));
        }
        if (!args.strict || !warned) {
            if (outfile) {
                if (args.verbose) {
                    utils.logVerbose('Writing output...');
                }
                for (const [file, contents] of spec.generatedFiles) {
                    pending.push(utils.writeFile(file, contents));
                }
            }
            else {
                process.stdout.write(spec.generatedFiles.get(null));
            }
        }
        await Promise.all(pending);
        if (args.strict && warned) {
            utils.logVerbose('Exiting with an error due to errors (omit --strict to write output anyway)');
            if (!args.verbose) {
                utils.logVerbose('Rerun with --verbose to see detailed error information');
            }
            process.exit(1);
        }
        if (args.watch) {
            const toWatch = new Set(spec.imports.map(i => i.importLocation).concat(infile));
            // remove any files that we're no longer watching
            for (const [file, watcher] of watching) {
                if (!toWatch.has(file)) {
                    watcher.close();
                    watching.delete(file);
                }
            }
            // watch any new files
            for (const file of toWatch) {
                if (!watching.has(file)) {
                    watching.set(file, fs.watch(file, build));
                }
            }
        }
    }
    catch (e) {
        if (args.watch) {
            process.stderr.write(e.stack);
        }
        else {
            throw e;
        }
    }
});
build().catch(e => {
    console.error(e);
    process.exit(1);
});
function normalizePath(absolute) {
    return path.relative(process.cwd(), absolute);
}
//# sourceMappingURL=cli.js.map