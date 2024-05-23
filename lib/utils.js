"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = exports.doesEffectPropagateToParent = exports.validateEffects = exports.attrValueLocation = exports.attrLocation = exports.offsetToLineAndColumn = exports.copyFile = exports.writeFile = exports.readBinaryFile = exports.readFile = exports.shouldInline = exports.logWarning = exports.logVerbose = exports.traverseWhile = exports.replaceTextNode = exports.domWalkBackward = exports.htmlToDom = exports.emdTextNode = exports.wrapEmdFailure = exports.warnEmdFailure = void 0;
const jsdom = require("jsdom");
const chalk = require("chalk");
const emd = require("ecmarkdown");
const fs = require("fs");
const path = require("path");
const utils_1 = require("./lint/utils");
function warnEmdFailure(report, node, e) {
    if (typeof e.line === 'number' && typeof e.column === 'number') {
        report({
            type: 'contents',
            ruleId: 'invalid-emd',
            message: `ecmarkdown failed to parse: ${e.message}`,
            node,
            nodeRelativeLine: e.line,
            nodeRelativeColumn: e.column,
        });
    }
    else {
        report({
            type: 'node',
            ruleId: 'invalid-emd',
            message: `ecmarkdown failed to parse: ${e.message}`,
            node,
        });
    }
}
exports.warnEmdFailure = warnEmdFailure;
function wrapEmdFailure(src) {
    return `#### ECMARKDOWN PARSE FAILED ####<pre>${src}</pre>`;
}
exports.wrapEmdFailure = wrapEmdFailure;
/** @internal */
function emdTextNode(spec, node, namespace) {
    const loc = spec.locate(node);
    let c;
    if ((loc === null || loc === void 0 ? void 0 : loc.endTag) == null) {
        c = node.textContent.replace(/</g, '&lt;');
    }
    else {
        const start = loc.startTag.endOffset;
        const end = loc.endTag.startOffset;
        c = loc.source.slice(start, end);
    }
    let processed;
    try {
        const parts = emd.parseFragment(c);
        if (spec.opts.lintSpec && loc != null) {
            const nonterminals = (0, utils_1.collectNonterminalsFromEmd)(parts).map(({ name, loc }) => ({
                name,
                loc,
                node,
                namespace,
            }));
            spec._ntStringRefs = spec._ntStringRefs.concat(nonterminals);
        }
        processed = emd.emit(parts);
    }
    catch (e) {
        warnEmdFailure(spec.warn, node, e);
        processed = wrapEmdFailure(c);
    }
    const template = spec.doc.createElement('template');
    template.innerHTML = processed;
    replaceTextNode(node, template.content);
}
exports.emdTextNode = emdTextNode;
/** @internal */
function htmlToDom(html) {
    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.on('error', () => {
        // Suppress warnings from e.g. CSS features not supported by JSDOM
    });
    return new jsdom.JSDOM(html, { includeNodeLocations: true, virtualConsole });
}
exports.htmlToDom = htmlToDom;
/** @internal */
function domWalkBackward(root, cb) {
    const childNodes = root.childNodes;
    const childLen = childNodes.length;
    for (let i = childLen - 1; i >= 0; i--) {
        const node = childNodes[i];
        if (node.nodeType !== 1)
            continue;
        const cont = cb(node);
        if (cont === false)
            continue;
        domWalkBackward(node, cb);
    }
}
exports.domWalkBackward = domWalkBackward;
/** @internal */
function replaceTextNode(node, frag) {
    // Append all the nodes
    const parent = node.parentNode;
    if (!parent)
        return [];
    const newXrefNodes = Array.from(frag.querySelectorAll('EMU-XREF'));
    const first = frag.childNodes[0];
    if (first.nodeType === 3) {
        node.textContent = first.textContent;
        frag.removeChild(first);
    }
    else {
        // set it to empty because we don't want to break iteration
        // (I think it should work to delete it... investigate possible jsdom bug)
        node.textContent = '';
    }
    parent.insertBefore(frag, node.nextSibling);
    return newXrefNodes;
}
exports.replaceTextNode = replaceTextNode;
/** @internal */
function traverseWhile(node, relationship, predicate, options) {
    var _a;
    const once = (_a = options === null || options === void 0 ? void 0 : options.once) !== null && _a !== void 0 ? _a : false;
    while (node != null && predicate(node)) {
        node = node[relationship];
        if (once)
            break;
    }
    return node;
}
exports.traverseWhile = traverseWhile;
/** @internal */
function logVerbose(str) {
    const dateString = new Date().toISOString();
    console.error(chalk.gray('[' + dateString + '] ') + str);
}
exports.logVerbose = logVerbose;
/** @internal */
function logWarning(str) {
    const dateString = new Date().toISOString();
    console.error(chalk.gray('[' + dateString + '] ') + chalk.red(str));
}
exports.logWarning = logWarning;
const CLAUSE_LIKE = ['EMU-ANNEX', 'EMU-CLAUSE', 'EMU-INTRO', 'EMU-NOTE', 'BODY'];
/** @internal */
function shouldInline(node) {
    var _a;
    const surrogateParentTags = ['EMU-GRAMMAR', 'EMU-IMPORT', 'INS', 'DEL'];
    const parent = traverseWhile(node.parentNode, 'parentNode', node => { var _a; return surrogateParentTags.includes((_a = node === null || node === void 0 ? void 0 : node.nodeName) !== null && _a !== void 0 ? _a : ''); });
    if (!parent)
        return false;
    const clauseLikeParent = CLAUSE_LIKE.includes(parent.nodeName) ||
        CLAUSE_LIKE.includes((_a = parent.getAttribute('data-simulate-tagname')) === null || _a === void 0 ? void 0 : _a.toUpperCase());
    return !clauseLikeParent;
}
exports.shouldInline = shouldInline;
/** @internal */
function readFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', (err, data) => (err ? reject(err) : resolve(data)));
    });
}
exports.readFile = readFile;
/** @internal */
function readBinaryFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => (err ? reject(err) : resolve(data)));
    });
}
exports.readBinaryFile = readBinaryFile;
/** @internal */
function writeFile(file, content) {
    return new Promise((resolve, reject) => {
        // we could do this async, but it's not worth worrying about
        fs.mkdirSync(path.dirname(file), { recursive: true });
        if (typeof content === 'string') {
            content = Buffer.from(content, 'utf8');
        }
        fs.writeFile(file, content, err => (err ? reject(err) : resolve()));
    });
}
exports.writeFile = writeFile;
/** @internal */
async function copyFile(src, dest) {
    const content = await readFile(src);
    await writeFile(dest, content);
}
exports.copyFile = copyFile;
function offsetToLineAndColumn(string, offset) {
    const lines = string.split('\n');
    let line = 0;
    let seen = 0;
    while (true) {
        if (line >= lines.length) {
            throw new Error(`offset ${offset} exceeded string ${JSON.stringify(string)}`);
        }
        if (seen + lines[line].length >= offset) {
            break;
        }
        seen += lines[line].length + 1; // +1 for the '\n'
        ++line;
    }
    const column = offset - seen;
    return { line: line + 1, column: column + 1 };
}
exports.offsetToLineAndColumn = offsetToLineAndColumn;
function attrLocation(source, loc, attr) {
    var _a;
    const attrLoc = (_a = loc.startTag.attrs) === null || _a === void 0 ? void 0 : _a[attr];
    if (attrLoc == null) {
        return { line: loc.startTag.startLine, column: loc.startTag.startCol };
    }
    else {
        return { line: attrLoc.startLine, column: attrLoc.startCol };
    }
}
exports.attrLocation = attrLocation;
function attrValueLocation(source, loc, attr) {
    var _a, _b, _c;
    const attrLoc = (_a = loc.startTag.attrs) === null || _a === void 0 ? void 0 : _a[attr];
    if (attrLoc == null || source == null) {
        return { line: loc.startTag.startLine, column: loc.startTag.startCol };
    }
    else {
        const tagText = source.slice(attrLoc.startOffset, attrLoc.endOffset);
        // RegExp.escape when
        const matcher = new RegExp(attr.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&') + '="?', 'i');
        return {
            line: attrLoc.startLine,
            column: attrLoc.startCol + ((_c = (_b = tagText.match(matcher)) === null || _b === void 0 ? void 0 : _b[0].length) !== null && _c !== void 0 ? _c : 0),
        };
    }
}
exports.attrValueLocation = attrValueLocation;
const KNOWN_EFFECTS = ['user-code'];
function validateEffects(spec, effectsRaw, node) {
    const effects = [];
    const unknownEffects = [];
    for (const e of effectsRaw) {
        if (KNOWN_EFFECTS.indexOf(e) !== -1) {
            effects.push(e);
        }
        else {
            unknownEffects.push(e);
        }
    }
    if (unknownEffects.length !== 0) {
        spec.warn({
            type: 'node',
            ruleId: 'unknown-effects',
            message: `unknown effects: ${unknownEffects}`,
            node,
        });
    }
    return effects;
}
exports.validateEffects = validateEffects;
function doesEffectPropagateToParent(node, effect) {
    var _a, _b;
    // Effects should not propagate past explicit fences in parent steps.
    //
    // Abstract Closures are considered automatic fences for the user-code
    // effect, since those are effectively nested functions.
    //
    // Calls to Abstract Closures that can call user code must be explicitly
    // marked as such with <emu-meta effects="user-code">...</emu-meta>.
    for (; node.parentElement; node = node.parentElement) {
        const parent = node.parentElement;
        // This is super hacky. It's checking the output of ecmarkdown.
        if (parent.tagName !== 'LI')
            continue;
        if (effect === 'user-code' &&
            /be a new (\w+ )*Abstract Closure/.test((_a = parent.textContent) !== null && _a !== void 0 ? _a : '')) {
            return false;
        }
        if ((_b = parent
            .getAttribute('fence-effects')) === null || _b === void 0 ? void 0 : _b.split(',').map(s => s.trim()).includes(effect)) {
            return false;
        }
    }
    return true;
}
exports.doesEffectPropagateToParent = doesEffectPropagateToParent;
function* zip(as, bs, allowMismatchedLengths = false) {
    var _a, _b;
    const iterA = as[Symbol.iterator]();
    const iterB = bs[Symbol.iterator]();
    while (true) {
        const iterResultA = iterA.next();
        const iterResultB = iterB.next();
        if (iterResultA.done !== iterResultB.done) {
            if (allowMismatchedLengths) {
                if (iterResultA.done) {
                    (_a = iterB.return) === null || _a === void 0 ? void 0 : _a.call(iterB);
                }
                else {
                    (_b = iterA.return) === null || _b === void 0 ? void 0 : _b.call(iterA);
                }
                break;
            }
            throw new Error('zipping iterators which ended at different times');
        }
        if (iterResultA.done) {
            break;
        }
        yield [iterResultA.value, iterResultB.value];
    }
}
exports.zip = zip;
//# sourceMappingURL=utils.js.map