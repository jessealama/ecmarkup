"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walk = exports.parse = exports.isProsePart = void 0;
const header_parser_1 = require("./header-parser");
const tokMatcher = /(?<olist>&laquo;|«)|(?<clist>&raquo;|»)|(?<orec>\{)|(?<crec>\})|(?<oparen>\()|(?<cparen>\))|(?<and>(?:, )?and )|(?<is> is )|(?<comma>,)|(?<x_of>\b\w+ of )|(?<with_args> with arguments? )/u;
const periodSpaceMatcher = /(?<period>\.(?= ))/u;
const periodSpaceOrEOFMatcher = /(?<period>\.(?= |$))/u;
function isProsePart(tok) {
    return (tok != null &&
        (tok.name === 'text' ||
            tok.name === 'comment' ||
            tok.name === 'tag' ||
            tok.name === 'opaqueTag' ||
            tok.name === 'star' ||
            tok.name === 'underscore' ||
            tok.name === 'double-brackets' ||
            tok.name === 'tick' ||
            tok.name === 'tilde' ||
            tok.name === 'pipe'));
}
exports.isProsePart = isProsePart;
class ParseFailure extends Error {
    constructor(message, offset) {
        super(message);
        this.offset = offset;
    }
}
function formatClose(close) {
    const mapped = close.map(c => {
        switch (c) {
            case 'clist':
                return 'list close';
            case 'crec':
                return 'record close';
            case 'cparen':
                return 'close parenthesis';
            case 'eof':
                return 'end of line';
            case 'with_args':
                return '"with argument(s)"';
            case 'comma':
                return 'comma';
            case 'period':
                return 'period';
            case 'and':
                return '"and"';
            case 'is':
                return '"is"';
            default:
                return c;
        }
    });
    return (0, header_parser_1.formatEnglishList)(mapped, 'or');
}
function addProse(items, token) {
    // sometimes we determine after seeing a token that it should not have been treated as a token
    if (isProsePart(token)) {
        const prev = items[items.length - 1];
        if (token.name === 'text' &&
            (prev === null || prev === void 0 ? void 0 : prev.name) === 'text' &&
            prev.location.end.offset === token.location.start.offset // might be false when e.g. skipping tags
        ) {
            // join with previous token
            items[items.length - 1] = {
                name: 'text',
                contents: prev.contents + token.contents,
                location: {
                    start: { offset: prev.location.start.offset },
                    end: { offset: token.location.end.offset },
                },
            };
        }
        else {
            items.push(token);
        }
    }
    else {
        // invoke addProse so it has a chance to join
        addProse(items, {
            name: 'text',
            contents: token.source,
            location: {
                start: { offset: token.offset },
                end: { offset: token.offset + token.source.length },
            },
        });
    }
}
function isWhitespace(x) {
    return x.name === 'text' && /^\s*$/.test(x.contents);
}
function isEmpty(s) {
    return s.items.every(i => isProsePart(i) && isWhitespace(i));
}
function emptyThingHasNewline(s) {
    // only call this function on things which pass isEmpty
    return s.items.some(i => i.contents.includes('\n'));
}
function getTagName(tok) {
    if (tok.name !== 'tag') {
        return null;
    }
    const lowcase = tok.contents.toLowerCase();
    if (lowcase.startsWith('<del>') || lowcase.startsWith('<del ')) {
        return 'open-del';
    }
    else if (lowcase.startsWith('</del>') || lowcase.startsWith('</del ')) {
        return 'close-del';
    }
    else if (lowcase.startsWith('<figure>') || lowcase.startsWith('<figure ')) {
        return 'open-figure';
    }
    else if (lowcase.startsWith('</figure>') || lowcase.startsWith('</figure ')) {
        return 'close-figure';
    }
    else {
        return null;
    }
}
class ExprParser {
    constructor(src, opNames) {
        this.srcIndex = 0;
        this.textTokOffset = null; // offset into current text node; only non-null if srcOffset points to a text node (but not conversely)
        this.next = [];
        this.src = src;
        this.opNames = opNames;
    }
    peek() {
        if (this.next.length === 0) {
            this.advance();
        }
        return this.next[0];
    }
    // this method is complicated because the underlying data is a sequence of ecmarkdown fragments, not a string
    advance() {
        var _a;
        const currentProse = [];
        const commitProse = () => {
            while (currentProse.length > 0) {
                const frag = currentProse.shift();
                this.next.push(frag);
            }
        };
        while (this.srcIndex < this.src.length) {
            let tok;
            if (this.textTokOffset == null) {
                tok = this.src[this.srcIndex];
            }
            else {
                const originalTok = this.src[this.srcIndex];
                const newContents = originalTok.contents.slice(this.textTokOffset);
                const newStart = originalTok.location.start.offset + this.textTokOffset;
                tok = {
                    name: 'text',
                    contents: newContents,
                    location: {
                        start: { offset: newStart },
                        end: { offset: newStart + newContents.length },
                    },
                };
            }
            let match = tok.name === 'text' ? tok.contents.match(tokMatcher) : null;
            if (tok.name === 'text' && match == null) {
                // in `foo.[[bar]]`, the `.` ends this text token, but should not be recognized as a period
                // but if `foo.` is the last token, it should be recognized as a period.
                const periodMatcher = this.srcIndex < this.src.length - 1 ? periodSpaceMatcher : periodSpaceOrEOFMatcher;
                match = tok.contents.match(periodMatcher);
            }
            // the `tok.name !== 'text'` part in the test below is redundant but makes TS happier
            if (tok.name !== 'text' || match == null) {
                const empty = (tok.name === 'text' && tok.contents.length === 0) ||
                    tok.name === 'tag' ||
                    tok.name === 'opaqueTag' ||
                    tok.name === 'comment';
                if (!empty) {
                    currentProse.push(tok);
                }
                ++this.srcIndex;
                this.textTokOffset = null;
                // skip anything in `<del>`
                const tagName = getTagName(tok);
                if (tagName === 'open-del') {
                    while (this.srcIndex < this.src.length &&
                        getTagName(this.src[this.srcIndex]) !== 'close-del') {
                        ++this.srcIndex;
                    }
                }
                else if (tagName === 'open-figure') {
                    while (this.srcIndex < this.src.length &&
                        getTagName(this.src[this.srcIndex]) !== 'close-figure') {
                        ++this.srcIndex;
                    }
                    commitProse();
                    this.next.push({
                        name: 'figure',
                        offset: tok.location.start.offset,
                        source: '',
                    });
                    return;
                }
                continue;
            }
            const { groups } = match;
            const before = tok.contents.slice(0, match.index);
            if (before.length > 0) {
                currentProse.push({
                    name: 'text',
                    contents: before,
                    location: {
                        start: tok.location.start,
                        end: { offset: tok.location.start.offset + before.length },
                    },
                });
            }
            const matchKind = Object.keys(groups).find(x => groups[x] != null);
            commitProse();
            this.textTokOffset = ((_a = this.textTokOffset) !== null && _a !== void 0 ? _a : 0) + match.index + match[0].length;
            this.next.push({
                name: matchKind,
                offset: tok.location.start.offset + match.index,
                source: groups[matchKind],
            });
            return;
        }
        commitProse();
        this.next.push({
            name: 'eof',
            offset: this.src.length === 0 ? 0 : this.src[this.src.length - 1].location.end.offset,
            source: '',
        });
    }
    // returns true if this ate a newline
    eatWhitespace() {
        let next;
        let hadNewline = false;
        while (isProsePart((next = this.peek()))) {
            if (next.name === 'text' && !/\S/.test(next.contents)) {
                hadNewline || (hadNewline = next.contents.includes('\n'));
                this.next.shift();
            }
            else {
                break;
            }
        }
        return hadNewline;
    }
    // guarantees the next token is an element of close
    parseSeq(close) {
        const items = [];
        while (true) {
            const next = this.peek();
            switch (next.name) {
                case 'and':
                case 'is':
                case 'period':
                case 'with_args':
                case 'comma': {
                    if (!close.includes(next.name)) {
                        addProse(items, next);
                        this.next.shift();
                        break;
                    }
                    if (items.length === 0) {
                        throw new ParseFailure(`unexpected ${next.name} (expected some content for element/argument)`, next.offset);
                    }
                    return { name: 'seq', items };
                }
                case 'eof': {
                    if (!close.includes('eof')) {
                        throw new ParseFailure(`unexpected eof (expected ${formatClose(close)})`, next.offset);
                    }
                    return { name: 'seq', items };
                }
                case 'olist': {
                    const startTok = this.next.shift();
                    const elements = [];
                    if (this.peek().name !== 'clist') {
                        while (true) {
                            elements.push(this.parseSeq(['clist', 'comma']));
                            if (this.peek().name === 'clist') {
                                break;
                            }
                            this.next.shift();
                        }
                    }
                    if (elements.length > 0 && isEmpty(elements[elements.length - 1])) {
                        if (elements.length === 1 || emptyThingHasNewline(elements[elements.length - 1])) {
                            // allow trailing commas when followed by whitespace
                            elements.pop();
                        }
                        else {
                            throw new ParseFailure(`unexpected list close (expected some content for element)`, this.peek().offset);
                        }
                    }
                    const endTok = this.next.shift(); // eat the clist
                    items.push({
                        name: 'list',
                        elements,
                        location: {
                            start: { offset: startTok.offset },
                            end: { offset: endTok.offset + endTok.source.length },
                        },
                    });
                    break;
                }
                case 'clist': {
                    if (!close.includes('clist')) {
                        throw new ParseFailure('unexpected list close without corresponding list open', next.offset);
                    }
                    return { name: 'seq', items };
                }
                case 'oparen': {
                    // scan backwards looking for stuff like `_foo_.bar`
                    // stop at the first space character or structured item
                    const callee = [];
                    for (let i = items.length - 1; i >= 0; --i) {
                        const ppart = items[i];
                        if (!isProsePart(ppart)) {
                            break;
                        }
                        if (ppart.name === 'text') {
                            const { contents } = ppart;
                            const spaceIndex = contents.lastIndexOf(' ');
                            if (spaceIndex !== -1) {
                                if (spaceIndex < contents.length - 1) {
                                    const calleePart = contents.slice(spaceIndex + 1);
                                    if (!/\p{Letter}/u.test(calleePart)) {
                                        // e.g. -(x + 1)
                                        break;
                                    }
                                    items[i] = {
                                        name: 'text',
                                        contents: contents.slice(0, spaceIndex + 1),
                                        location: {
                                            start: { offset: ppart.location.start.offset },
                                            end: { offset: ppart.location.start.offset + spaceIndex + 1 },
                                        },
                                    };
                                    const startOffset = ppart.location.start.offset + spaceIndex + 1;
                                    // calleePart is nonempty because it matches \p{Letter}
                                    callee.unshift({
                                        name: 'text',
                                        contents: calleePart,
                                        location: {
                                            start: { offset: startOffset },
                                            end: { offset: startOffset + calleePart.length },
                                        },
                                    });
                                }
                                break;
                            }
                        }
                        callee.unshift(ppart);
                        items.pop();
                    }
                    if (callee.length > 0) {
                        if (callee[0].name === 'text') {
                            // check for -F(), which is negation of F() not an AO named -F
                            const initialNonLetter = callee[0].contents.match(/^\P{Letter}+/u);
                            if (initialNonLetter != null) {
                                const extra = initialNonLetter[0].length;
                                const extraLoc = callee[0].location.start.offset;
                                // we know by construction that there is at least one letter, so this is guaranteed to be nonempty
                                callee[0].contents = callee[0].contents.substring(extra);
                                callee[0].location.start.offset += extra;
                                const contents = callee[0].contents.substring(0, extra);
                                addProse(items, {
                                    name: 'text',
                                    contents,
                                    location: {
                                        start: { offset: extraLoc },
                                        end: { offset: extraLoc + contents.length },
                                    },
                                });
                            }
                        }
                        this.next.shift();
                        const args = [];
                        if (this.peek().name !== 'cparen') {
                            while (true) {
                                args.push(this.parseSeq(['cparen', 'comma']));
                                if (this.peek().name === 'cparen') {
                                    break;
                                }
                                this.next.shift();
                            }
                        }
                        if (args.length > 0 && isEmpty(args[args.length - 1])) {
                            if (args.length === 1 || emptyThingHasNewline(args[args.length - 1])) {
                                // allow trailing commas when followed by a newline
                                args.pop();
                            }
                            else {
                                throw new ParseFailure(`unexpected close parenthesis (expected some content for argument)`, this.peek().offset);
                            }
                        }
                        const cParen = this.next.shift();
                        items.push({
                            name: 'call',
                            callee,
                            arguments: args,
                            location: {
                                start: { offset: callee[0].location.start.offset },
                                end: { offset: cParen.offset + cParen.source.length },
                            },
                        });
                    }
                    else {
                        const oParen = this.next.shift();
                        const parenContents = this.parseSeq(['cparen']).items;
                        const cParen = this.next.shift();
                        items.push({
                            name: 'paren',
                            items: parenContents,
                            location: {
                                start: { offset: oParen.offset },
                                end: { offset: cParen.offset + cParen.source.length },
                            },
                        });
                    }
                    break;
                }
                case 'cparen': {
                    if (!close.includes('cparen')) {
                        throw new ParseFailure('unexpected close parenthesis without corresponding open parenthesis', next.offset);
                    }
                    return { name: 'seq', items };
                }
                case 'orec': {
                    const oRecTok = this.next.shift();
                    let type = null;
                    const members = [];
                    while (true) {
                        const hadNewline = this.eatWhitespace();
                        const nextTok = this.peek();
                        if (nextTok.name === 'crec') {
                            if (!hadNewline) {
                                // ideally this would be a lint failure, or better yet a formatting thing, but whatever
                                throw new ParseFailure(members.length > 0
                                    ? 'trailing commas are only allowed when followed by a newline'
                                    : 'records cannot be empty', nextTok.offset);
                            }
                            break;
                        }
                        if (!isProsePart(nextTok)) {
                            throw new ParseFailure('expected to find record field name', nextTok.offset);
                        }
                        if (nextTok.name !== 'double-brackets') {
                            const skipWs = nextTok.name === 'text' ? nextTok.contents.match(/^\s*/)[0].length : 0;
                            throw new ParseFailure('expected to find record field name', nextTok.location.start.offset + skipWs);
                        }
                        const { contents: name } = nextTok;
                        if (members.find(x => x.name === name)) {
                            throw new ParseFailure(`duplicate record field name ${name}`, nextTok.location.start.offset + 2);
                        }
                        this.next.shift();
                        const afterName = this.peek();
                        const colonMatch = afterName.name === 'text' ? afterName.contents.match(/^\s*:/) : null;
                        if (colonMatch != null) {
                            const afterNameAsText = afterName;
                            const withoutColon = afterNameAsText.contents.slice(colonMatch[0].length);
                            const offset = afterNameAsText.location.start.offset + colonMatch[0].length;
                            this.next[0] = {
                                name: 'text',
                                contents: withoutColon,
                                location: {
                                    start: { offset },
                                    end: { offset: offset + withoutColon.length },
                                },
                            };
                            if (type == null) {
                                type = 'record';
                            }
                            else if (type === 'record-spec') {
                                throw new ParseFailure('record field has value but preceding field does not', offset - 1);
                            }
                            const value = this.parseSeq(['crec', 'comma']);
                            if (value.items.length === 0) {
                                throw new ParseFailure('expected record field to have value', offset);
                            }
                            members.push({ name, value });
                        }
                        else {
                            if (type == null) {
                                type = 'record-spec';
                            }
                            else if (type === 'record') {
                                throw new ParseFailure('expected record field to have value', nextTok.location.end.offset);
                            }
                            members.push({ name });
                            this.eatWhitespace();
                            if (!['crec', 'comma'].includes(this.peek().name)) {
                                throw new ParseFailure(`expected ${formatClose(['crec', 'comma'])}`, nextTok.location.end.offset);
                            }
                        }
                        if (this.peek().name === 'crec') {
                            break;
                        }
                        this.next.shift(); // eat the comma
                    }
                    const cRecTok = this.next.shift();
                    // @ts-expect-error typing this properly is annoying
                    items.push({
                        name: type,
                        members,
                        location: {
                            start: { offset: oRecTok.offset },
                            end: { offset: cRecTok.offset + cRecTok.source.length },
                        },
                    });
                    break;
                }
                case 'crec': {
                    if (!close.includes('crec')) {
                        throw new ParseFailure('unexpected end of record without corresponding start of record', next.offset);
                    }
                    return { name: 'seq', items };
                }
                case 'x_of': {
                    this.next.shift();
                    const callee = next.source.split(' ')[0];
                    if (!this.opNames.has(callee)) {
                        addProse(items, next);
                        break;
                    }
                    const parseNode = this.parseSeq([
                        'eof',
                        'period',
                        'comma',
                        'cparen',
                        'clist',
                        'crec',
                        'with_args',
                    ]);
                    const args = [];
                    if (this.peek().name === 'with_args') {
                        this.next.shift();
                        while (true) {
                            args.push(this.parseSeq([
                                'eof',
                                'period',
                                'and',
                                'is',
                                'comma',
                                'cparen',
                                'clist',
                                'crec',
                                'with_args',
                            ]));
                            if (!['and', 'comma'].includes(this.peek().name)) {
                                break;
                            }
                            this.next.shift();
                        }
                    }
                    const lastThing = args.length > 0 ? args[args.length - 1] : parseNode;
                    items.push({
                        name: 'sdo-call',
                        callee: [
                            {
                                name: 'text',
                                contents: callee,
                                location: {
                                    start: { offset: next.offset },
                                    end: { offset: next.offset + callee.length },
                                },
                            },
                        ],
                        parseNode,
                        arguments: args,
                        location: {
                            start: { offset: next.offset },
                            end: { offset: lastThing.items[lastThing.items.length - 1].location.end.offset },
                        },
                    });
                    break;
                }
                case 'figure': {
                    const tok = this.next.shift();
                    items.push({
                        name: 'figure',
                        location: {
                            start: { offset: tok.offset },
                            end: { offset: tok.offset + tok.source.length },
                        },
                    });
                    break;
                }
                default: {
                    if (isProsePart(next)) {
                        addProse(items, next);
                        this.next.shift();
                        break;
                    }
                    else {
                        // @ts-expect-error
                        throw new Error(`unreachable: unknown token type ${next.name}`);
                    }
                }
            }
        }
    }
}
// Note: this does not necessarily represent the entire input
// in particular it may omit some whitespace, tags, and comments
function parse(src, opNames) {
    const parser = new ExprParser(src, opNames);
    try {
        return parser.parseSeq(['eof']);
    }
    catch (e) {
        if (e instanceof ParseFailure) {
            return { name: 'failure', message: e.message, offset: e.offset };
        }
        throw e;
    }
}
exports.parse = parse;
// NB: paths are currently missing the index for prose sequences
// nothing needs this as yet so I haven't bothered finding a good way to represent it
function walk(f, current, path = []) {
    f(current, path);
    switch (current.name) {
        case 'list': {
            for (let i = 0; i < current.elements.length; ++i) {
                path.push({ parent: current, index: i });
                walk(f, current.elements[i], path);
                path.pop();
            }
            break;
        }
        case 'record': {
            for (let i = 0; i < current.members.length; ++i) {
                path.push({ parent: current, index: i });
                walk(f, current.members[i].value, path);
                path.pop();
            }
            break;
        }
        case 'sdo-call': {
            for (const part of current.callee) {
                walk(f, part, path);
            }
            for (let i = 0; i < current.arguments.length; ++i) {
                path.push({ parent: current, index: i });
                walk(f, current.arguments[i], path);
                path.pop();
            }
            break;
        }
        case 'call': {
            for (const part of current.callee) {
                walk(f, part, path);
            }
            for (let i = 0; i < current.arguments.length; ++i) {
                path.push({ parent: current, index: i });
                walk(f, current.arguments[i], path);
                path.pop();
            }
            break;
        }
        case 'paren':
        case 'seq': {
            for (let i = 0; i < current.items.length; ++i) {
                path.push({ parent: current, index: i });
                walk(f, current.items[i], path);
                path.pop();
            }
            break;
        }
        case 'underscore':
        case 'double-brackets':
        case 'comment':
        case 'figure':
        case 'opaqueTag':
        case 'pipe':
        case 'record-spec':
        case 'star':
        case 'tag':
        case 'text':
        case 'tick':
        case 'tilde': {
            break;
        }
        default: {
            // @ts-expect-error
            throw new Error(`unreachable: unknown expression node type ${current.name}`);
        }
    }
}
exports.walk = walk;
//# sourceMappingURL=expr-parser.js.map