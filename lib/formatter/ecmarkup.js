"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printStartTag = exports.printElement = exports.printDocument = exports.VOID_ELEMENTS = void 0;
const parse5_1 = require("parse5");
const ecmarkdown_1 = require("ecmarkdown");
const dedent = require("dedent-js");
const line_builder_1 = require("./line-builder");
const text_1 = require("./text");
const ecmarkdown_2 = require("./ecmarkdown");
const grammarkdown_1 = require("./grammarkdown");
const header_parser_1 = require("../header-parser");
const header_1 = require("./header");
// prettier-ignore
const RAW_CONTENT_ELEMENTS = new Set([
    'pre',
    'script',
    'style',
    'code',
]);
// https://html.spec.whatwg.org/multipage/syntax.html#void-elements
// prettier-ignore
exports.VOID_ELEMENTS = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
]);
const ALWAYS_BLOCK_ELEMENTS = new Set([
    'head',
    'body',
    'style',
    'pre',
    'emu-clause',
    'emu-intro',
    'emu-annex',
    'emu-alg',
    'emu-table',
    'table',
    'thead',
    'tbody',
    'div',
    'ul',
    'ol',
]);
// These are on their own line, but their contents are inline rather than indented
const PARAGRAPH_LIKE_ELEMENTS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
async function printDocument(src) {
    var _a;
    const tree = (0, parse5_1.parse)(src, { sourceCodeLocationInfo: true });
    if (tree.childNodes.length === 0 || tree.childNodes.length > 2) {
        throw new Error('document has too many top-level nodes');
    }
    let htmlEle;
    const leadingComments = [];
    while (((_a = tree.childNodes[0]) === null || _a === void 0 ? void 0 : _a.nodeName) === '#comment') {
        leadingComments.push(tree.childNodes.shift());
    }
    if (tree.childNodes.length === 1) {
        if (tree.childNodes[0].nodeName !== 'html') {
            throw new Error('expected top-level node to be html');
        }
        htmlEle = tree.childNodes[0];
    }
    else {
        if (tree.childNodes[0].nodeName !== '#documentType' || tree.childNodes[1].nodeName !== 'html') {
            throw new Error('expected top-level node to be html');
        }
        htmlEle = tree.childNodes[1];
    }
    // TODO reconsider outputting doctype - maybe that should be in the rendering, not the source?
    const output = new line_builder_1.LineBuilder(0);
    output.appendLine(`<!DOCTYPE html>`);
    for (const comment of leadingComments) {
        output.append(await printChildNodes(src, [comment], false, false, 0));
        output.linebreak();
    }
    if (htmlEle.attrs.length > 0) {
        output.appendLine(printStartTag(htmlEle));
    }
    const contents = htmlEle.childNodes.filter(n => !isWhitespace(n));
    if (contents.length !== 2 || contents[0].nodeName !== 'head' || contents[1].nodeName !== 'body') {
        throw new Error('expected html to have head and body');
    }
    const head = contents[0];
    const body = contents[1];
    // TODO strip, auto-gen meta-charset tag
    // parse5 has a bug where the last text node in the body has location extending past the body close tag
    const lastBody = body.childNodes[body.childNodes.length - 1];
    if ((lastBody === null || lastBody === void 0 ? void 0 : lastBody.nodeName) === '#text') {
        const lastBodySource = src.substring(lastBody.sourceCodeLocation.startOffset, lastBody.sourceCodeLocation.endOffset);
        const bugMatch = lastBodySource.match(/<\/body>\s*(<\/html>\s*)?$/i);
        if (bugMatch) {
            lastBody.sourceCodeLocation.endOffset -= bugMatch[0].length;
        }
    }
    if (head.attrs.length > 0 || body.attrs.length > 0) {
        // guess we gotta print them
        output.append(await printElement(src, head, 0));
        output.append(await printElement(src, body, 0));
    }
    else {
        output.append(await printChildNodes(src, head.childNodes, false, false, 0));
        output.append(await printChildNodes(src, body.childNodes, false, false, 0));
    }
    while (output.lines[0] === '') {
        output.lines.shift();
    }
    if (output.last !== '') {
        output.linebreak();
    }
    else if (output.lines.length > 1 && output.lines[output.lines.length - 2] === '') {
        output.lines.pop();
    }
    return output.lines.join('\n');
}
exports.printDocument = printDocument;
async function printElement(src, node, indent) {
    var _a, _b, _c, _d, _e;
    const block = isBlockElement(node);
    const output = new line_builder_1.LineBuilder(indent);
    let childNodes = node.childNodes;
    if (exports.VOID_ELEMENTS.has(node.tagName)) {
        if (childNodes.length > 0) {
            bad(node, `${node.tagName} nodes are not expected to have children`);
        }
        output.appendText(printStartTag(node));
        return output;
    }
    // todo a switch, I guess
    // TODO handle script - w/ content vs not-with-content means block vs non-block
    if (RAW_CONTENT_ELEMENTS.has(node.tagName)) {
        const contents = `${printStartTag(node)}${rawContent(src, node)}</${node.tagName}>`;
        if (block) {
            output.appendLine(contents, true);
        }
        else {
            output.appendText(contents, true);
        }
        return output;
    }
    if (PARAGRAPH_LIKE_ELEMENTS.has(node.tagName)) {
        output.firstLineIsPartial = false;
        output.appendText(printStartTag(node));
        const body = await printChildNodes(src, childNodes, false, false, indent + 1);
        body.trim();
        if (body.lines.length > 1) {
            output.linebreak();
            ++output.indent;
            output.append(body);
            --output.indent;
            output.linebreak();
        }
        else {
            output.append(body);
        }
        output.appendText(`</${node.tagName}>`);
        output.linebreak();
        return output;
    }
    if (node.tagName === 'emu-alg') {
        const contents = rawContent(src, node);
        let parsed;
        try {
            parsed = (0, ecmarkdown_1.parseAlgorithm)(contents);
        }
        catch (e) {
            // TODO error location information, ugh
            bad(node, 'failed to parse algorithm');
        }
        output.appendLine(printStartTag(node));
        output.append(await (0, ecmarkdown_2.printAlgorithm)(contents, parsed, indent + 1));
        output.appendLine(`</${node.tagName}>`);
        return output;
    }
    if (node.tagName === 'emu-eqn') {
        const contents = rawContent(src, node);
        let parsed;
        try {
            parsed = (0, ecmarkdown_1.parseFragment)(contents);
        }
        catch (e) {
            // TODO error location information, ugh
            bad(node, 'failed to parse emu-eqn');
        }
        // all but the first line should be indented twice
        const printed = await (0, ecmarkdown_2.printFragments)(contents, parsed, indent + 2);
        const nonWhitespace = printed.lines.filter(l => !/^s*$/.test(l));
        if (block || nonWhitespace.length > 1) {
            while (printed.lines[0] === '') {
                printed.lines.shift();
            }
            // tweak result to ensure first line has 1 level of indent
            printed.lines[0] = printed.lines[0].trim();
            printed.firstLineIsPartial = true;
            output.appendLine(printStartTag(node));
            ++output.indent;
            output.append(printed);
            --output.indent;
            output.appendLine(`</${node.tagName}>`);
        }
        else {
            output.appendText(printStartTag(node));
            ++output.indent;
            output.appendText(((_a = nonWhitespace[0]) !== null && _a !== void 0 ? _a : '').trim());
            --output.indent;
            output.appendText(`</${node.tagName}>`);
        }
        return output;
    }
    if (node.tagName === 'emu-grammar') {
        const contents = rawContent(src, node);
        // TODO error location information
        const printed = await (0, grammarkdown_1.printGrammar)(contents, indent + 1);
        const isCurrentlyMultiline = /^ *\n/.test(contents);
        if (printed.isEmpty() ||
            (printed.lines.length === 2 && printed.last === '' && !isCurrentlyMultiline)
        // TODO maybe replace isCurrentlyMultiline with !isAtStartOfLine(src, node)
        ) {
            output.appendText(printStartTag(node));
            output.appendText(printed.lines[0].trim());
            output.appendText(`</${node.tagName}>`);
        }
        else {
            output.appendLine(printStartTag(node));
            output.append(printed);
            output.appendLine(`</${node.tagName}>`);
        }
        return output;
    }
    if (node.tagName === 'emu-clause' ||
        node.tagName === 'emu-intro' ||
        node.tagName === 'emu-annex') {
        // add a blank line before every clause
        output.linebreak();
        output.linebreak();
        output.appendLine(printStartTag(node));
        ++output.indent;
        // todo probably want "isWhitespaceOrComment", really
        let maybeH1Index = 0;
        while (maybeH1Index < childNodes.length && isWhitespace(childNodes[maybeH1Index])) {
            ++maybeH1Index;
        }
        let maybeDLIndex = maybeH1Index + 1;
        while (maybeDLIndex < childNodes.length && isWhitespace(childNodes[maybeDLIndex])) {
            ++maybeDLIndex;
        }
        let dropLeadingLinebreaks = true;
        if (((_b = childNodes[maybeH1Index]) === null || _b === void 0 ? void 0 : _b.nodeName) === 'h1' &&
            ((_c = childNodes[maybeDLIndex]) === null || _c === void 0 ? void 0 : _c.nodeName) === 'dl' &&
            childNodes[maybeDLIndex].attrs.some(a => a.name === 'class' && a.value === 'header')) {
            const h1 = childNodes[maybeH1Index];
            const parseResult = (0, header_parser_1.parseH1)(rawContent(src, h1));
            if (parseResult.type !== 'failure' && parseResult.errors.length === 0) {
                const type = (_e = (_d = node.attrs.find(a => a.name === 'type')) === null || _d === void 0 ? void 0 : _d.value) !== null && _e !== void 0 ? _e : null;
                const printedHeader = (0, header_1.printHeader)(parseResult, type, indent + 2);
                output.append(await printChildNodes(src, childNodes.slice(0, maybeH1Index), true, true, indent + 1));
                if (output.last !== '') {
                    output.linebreak();
                }
                output.appendText(printStartTag(h1));
                output.append(printedHeader);
                output.appendText(`</h1>`);
                output.linebreak();
                childNodes = childNodes.slice(maybeH1Index + 1);
                dropLeadingLinebreaks = false;
            }
        }
        output.append(await printChildNodes(src, childNodes, dropLeadingLinebreaks, true, indent + 1));
        --output.indent;
        output.appendLine(`</${node.tagName}>`);
        return output;
    }
    if (node.tagName === 'table') {
        // skip <tbody>, it's just an extra level of indentation
        // "A tbody element's start tag can be omitted if the first thing inside the tbody element is a tr element, and if the element is not immediately preceded by a tbody, thead, or tfoot element whose end tag has been omitted."
        // - https://html.spec.whatwg.org/dev/tables.html#the-tbody-element
        childNodes = childNodes.flatMap(c => {
            if (c.nodeName !== 'tbody') {
                return [c];
            }
            if (c.attrs.length > 0) {
                return [c];
            }
            for (let i = 0; i < c.childNodes.length; ++i) {
                const child = c.childNodes[i];
                if (child.nodeName === 'tr') {
                    return c.childNodes;
                }
                if (!isWhitespace(child)) {
                    break;
                }
            }
            return [c];
        });
    }
    if (block) {
        output.appendLine(printStartTag(node));
        ++output.indent;
        output.append(await printChildNodes(src, childNodes, true, true, indent + 1));
        --output.indent;
        output.appendLine(`</${node.nodeName}>`);
    }
    else {
        output.appendText(printStartTag(node));
        ++output.indent;
        output.append(await printChildNodes(src, childNodes, false, true, indent + 1));
        --output.indent;
        const trailingSpace = output.last.endsWith(' ');
        if (trailingSpace) {
            output.last = output.last.trimEnd();
        }
        output.appendText(`</${node.tagName}>`);
        if (trailingSpace) {
            output.appendText(' ');
        }
    }
    return output;
}
exports.printElement = printElement;
async function printChildNodes(src, nodes, dropLeadingLinebreaks, dropTrailingLinebreaks, indent) {
    const output = new line_builder_1.LineBuilder(indent);
    let skipNextElement = false;
    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        if (node.nodeName === '#comment') {
            const contents = node.data.trim();
            if (contents.startsWith('emu-format ignore')) {
                skipNextElement = true;
            }
            if (contents.includes('\n')) {
                output.appendText('<!--');
                output.linebreak();
                const dedented = dedent(node.data);
                for (const line of dedented.split('\n')) {
                    if (line.trim() !== '') {
                        // we have to do this manually because lineBuilder assumes it should handle all indentation
                        // but we want to preserve any manual indentation provided by the user
                        output.last = '  '.repeat(indent + 1) + line;
                    }
                    output.linebreak();
                }
                output.appendText('-->');
            }
            else {
                output.appendText(`<!-- ${contents} -->`, true);
            }
        }
        else if (node.nodeName === '#text') {
            const loc = node.sourceCodeLocation;
            let value = src.substring(loc.startOffset, loc.endOffset);
            if (dropLeadingLinebreaks && i === 0) {
                value = value.replace(/^ *\n+/, '');
            }
            if (dropTrailingLinebreaks && i === nodes.length - 1) {
                value = value.replace(/\n+ *$/, '');
            }
            if (value === '') {
                continue;
            }
            let parsed;
            try {
                parsed = (0, ecmarkdown_1.parseFragment)(value);
            }
            catch (e) {
                parsed = null;
            }
            if (parsed) {
                output.append(await (0, ecmarkdown_2.printFragments)(value, parsed, indent));
            }
            else {
                output.append((0, text_1.printText)(value, indent));
            }
        }
        else {
            const ele = node; // uuuuuuugh, I hate that typescript requires this cast
            if (skipNextElement) {
                skipNextElement = false;
                output.appendText(src.substring(ele.sourceCodeLocation.startOffset, ele.sourceCodeLocation.endOffset), true);
            }
            else if (ele.tagName === 'br') {
                if (ele.attrs.length > 0) {
                    bad(ele, `br nodes are not expected to have attributes`);
                }
                if (output.isEmpty()) {
                    output.appendLine('<br>');
                }
                else {
                    // special case: <br> goes at the end of a line of text, when it is possible to do so
                    let lastNonBlank = output.lines.length - 1;
                    while (output.lines[lastNonBlank] === '') {
                        // someday, findLastIndex
                        --lastNonBlank;
                    }
                    output.lines[lastNonBlank] = output.lines[lastNonBlank].trimEnd() + '<br>';
                    if (lastNonBlank === output.lines.length - 1) {
                        output.linebreak();
                    }
                }
            }
            else {
                output.append(await printElement(src, ele, indent));
            }
        }
    }
    return output;
}
function isBlockElement(element) {
    var _a;
    if (ALWAYS_BLOCK_ELEMENTS.has(element.tagName)) {
        return true;
    }
    if (((_a = element.childNodes[0]) === null || _a === void 0 ? void 0 : _a.nodeName) === '#text' &&
        /^ *\n/.test(element.childNodes[0].value)) {
        return true;
    }
    return false;
}
function printStartTag(tag) {
    // TODO sort attributes somehow
    if (tag.attrs.length === 0) {
        return `<${tag.tagName}>`;
    }
    return `<${tag.tagName} ${tag.attrs.map(printAttr).join(' ')}>`;
}
exports.printStartTag = printStartTag;
function printAttr(attr) {
    if (attr.value === '') {
        return attr.name;
    }
    return `${attr.name}=${JSON.stringify(attr.value)}`;
}
function isWhitespace(node) {
    return node.nodeName === '#text' && /^[ \t\n]*$/.test(node.value);
}
function rawContent(src, node) {
    var _a, _b;
    const loc = node.sourceCodeLocation;
    if (typeof ((_a = loc.startTag) === null || _a === void 0 ? void 0 : _a.endOffset) !== 'number' || typeof ((_b = loc.endTag) === null || _b === void 0 ? void 0 : _b.startOffset) !== 'number') {
        bad(node, `<${node.nodeName}> nodes must be explicitly opened and closed`);
    }
    return src.substring(loc.startTag.endOffset, loc.endTag.startOffset);
}
// function isAtStartOfLine(source: string, node: Element) {
//   for (let i = node.__location!.startOffset - 1; i >= 0; --i) {
//     let char = source[i];
//     if (char === '\n' || char === '\r') {
//       return true;
//     } else if (char !== ' ') {
//       return false;
//     }
//   }
//   return false;
// }
function bad(node, msg) {
    var _a, _b, _c;
    msg += ` at ${process.argv[2]}`;
    const loc = typeof ((_b = (_a = node.sourceCodeLocation) === null || _a === void 0 ? void 0 : _a.startTag) === null || _b === void 0 ? void 0 : _b.startLine) === 'number'
        ? node.sourceCodeLocation.startTag
        : typeof ((_c = node.sourceCodeLocation) === null || _c === void 0 ? void 0 : _c.startLine) === 'number'
            ? node.sourceCodeLocation
            : null;
    if (loc != null) {
        msg += `:${loc.startLine}:${loc.startCol}`;
    }
    throw new Error(msg);
}
//# sourceMappingURL=ecmarkup.js.map