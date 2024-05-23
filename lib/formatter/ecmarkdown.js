"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printFragments = exports.printAlgorithm = void 0;
const parse5_1 = require("parse5");
const line_builder_1 = require("./line-builder");
const ecmarkup_1 = require("./ecmarkup");
const text_1 = require("./text");
async function printAlgorithm(source, alg, indent) {
    return await printListNode(source, alg.contents, indent);
}
exports.printAlgorithm = printAlgorithm;
async function printListNode(source, node, indent) {
    const output = new line_builder_1.LineBuilder(indent);
    for (const item of node.contents) {
        output.append(await printStep(source, item, indent));
    }
    return output;
}
async function printStep(source, item, indent) {
    const output = new line_builder_1.LineBuilder(indent);
    output.firstLineIsPartial = false;
    output.appendText(item.name === 'ordered-list-item' ? '1. ' : '* ');
    if (item.attrs.length > 0) {
        const joined = item.attrs
            .map(({ key, value }) => (value === '' ? key : `${key}=${JSON.stringify(value)}`))
            .join(', ');
        output.appendText(`[${joined}] `);
    }
    const contents = await printFragments(source, item.contents, indent + 1);
    // this is a bit gross, but whatever
    contents.lines[0] = contents.lines[0].trimStart();
    output.append(contents);
    if (output.last !== '') {
        // it can be empty if, for example, the step ends in a block element
        output.linebreak();
    }
    // TODO fix up `Repeat:` to `Repeat,` etc
    if (item.sublist == null) {
        return output;
    }
    output.append(await printListNode(source, item.sublist, indent + 1));
    return output;
}
async function printFragments(source, contents, indent) {
    const output = new line_builder_1.LineBuilder(indent);
    let skipNextElement = false;
    for (let i = 0; i < contents.length; ++i) {
        const node = contents[i];
        switch (node.name) {
            case 'underscore':
            case 'text': {
                // ecmarkdown has a very permissive parser
                // this means figuring out exactly which things were escaped is difficult
                // so don't even bother
                const { start, end } = node.location;
                const originalText = source.substring(start.offset, end.offset);
                output.append((0, text_1.printText)(originalText, indent));
                break;
            }
            case 'comment': {
                // for some reason emd comment nodes include the comment tokens
                // and also leading whitespace (???)
                // TODO think about that / maybe pad with spaces
                // TODO use the main printer for these, maybe
                if (node.contents.match(/^\s*<!--\s*emu-format ignore/)) {
                    skipNextElement = true;
                }
                output.appendText(node.contents, true);
                break;
            }
            case 'opaqueTag': {
                // TODO parse and format this properly
                // including causing it to be a block tag (if that doesn't break stuff)
                // needs tests too
                // TODO just collapse this with below case
                output.appendText(node.contents, true);
                break;
            }
            case 'tag': {
                let htmlBits = null;
                const tagMatch = node.contents.match(/^<([a-z]+)/i);
                if (tagMatch != null) {
                    const name = tagMatch[1];
                    if (ecmarkup_1.VOID_ELEMENTS.has(name.toLowerCase())) {
                        htmlBits = node.contents;
                    }
                    else {
                        let depth = 1;
                        for (let j = i + 1; j < contents.length; ++j) {
                            const otherNode = contents[j];
                            if (otherNode.name !== 'tag') {
                                continue;
                            }
                            const otherTagMatch = otherNode.contents.match(/^<\/?([a-z]+)/i);
                            if (otherTagMatch != null) {
                                const otherName = otherTagMatch[1];
                                if (name.toLowerCase() !== otherName.toLowerCase()) {
                                    continue;
                                }
                                const isOpen = otherNode.contents[1] !== '/';
                                if (isOpen) {
                                    ++depth;
                                }
                                else {
                                    --depth;
                                }
                                if (depth === 0) {
                                    htmlBits = source.substring(node.location.start.offset, otherNode.location.end.offset);
                                    i = j;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (htmlBits == null) {
                    output.appendText(node.contents);
                }
                else if (skipNextElement) {
                    skipNextElement = false;
                    output.appendText(htmlBits.trim(), true);
                }
                else {
                    htmlBits = htmlBits.trim(); // ecmarkdown includes whitespace sometimes???
                    // TODO try/catch for better error reporting
                    const fragment = (0, parse5_1.parseFragment)(htmlBits, { sourceCodeLocationInfo: true });
                    if (fragment.childNodes.length !== 1) {
                        throw new Error('confusing parse - this should not be possible; please report it to ecmarkup');
                    }
                    const element = fragment.childNodes[0];
                    output.append(await (0, ecmarkup_1.printElement)(htmlBits, element, indent));
                }
                break;
            }
            case 'pipe': {
                output.appendText('|');
                output.appendText(node.nonTerminal);
                if (node.params) {
                    // TODO sort parameters?
                    output.appendText(`[${node.params}]`);
                }
                if (node.optional) {
                    output.appendText('?');
                }
                output.appendText('|');
                break;
            }
            case 'star':
            case 'tick':
            case 'tilde': {
                output.append(await printFormat(source, node, indent));
                break;
            }
            case 'double-brackets': {
                output.appendText(`[[${node.contents}]]`);
                break;
            }
            default: {
                // @ts-expect-error
                throw new Error(`Unknown node type ${node.name}`);
            }
        }
    }
    return output;
}
exports.printFragments = printFragments;
async function printFormat(source, node, indent) {
    let tok;
    switch (node.name) {
        case 'star': {
            tok = '*';
            break;
        }
        case 'tick':
            tok = '`';
            break;
        case 'tilde':
            tok = '~';
            break;
        default: {
            // @ts-expect-error
            throw new Error(`Unknown node type ${node.name}`);
        }
    }
    const output = new line_builder_1.LineBuilder(indent);
    output.appendText(tok);
    output.append(await printFragments(source, node.contents, indent));
    output.appendText(tok);
    return output;
}
//# sourceMappingURL=ecmarkdown.js.map