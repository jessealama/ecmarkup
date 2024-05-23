"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replacerForNamespace = exports.autolink = exports.YES_CLAUSE_AUTOLINK = exports.NO_CLAUSE_AUTOLINK = void 0;
const Xref_1 = require("./Xref");
const utils = require("./utils");
const escape = require('html-escape');
exports.NO_CLAUSE_AUTOLINK = new Set([
    'PRE',
    'CODE',
    'SCRIPT',
    'STYLE',
    'EMU-CONST',
    'EMU-PRODUCTION',
    'EMU-GRAMMAR',
    'EMU-XREF',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'EMU-VAR',
    'EMU-VAL',
    'VAR',
    'A',
    'DFN',
    'SUB',
    'EMU-NOT-REF',
]);
exports.YES_CLAUSE_AUTOLINK = new Set(['EMU-GMOD']); // these are processed even if they are nested in NO_CLAUSE_AUTOLINK contexts
function autolink(node, replacer, autolinkmap, clause, currentId, allowSameId) {
    const spec = clause.spec;
    const template = spec.doc.createElement('template');
    const content = escape(node.textContent);
    // null indicates we haven't done the analysis for this node yet
    let isInAlg = null;
    const autolinked = content.replace(replacer, (match, offset) => {
        const entry = autolinkmap[narrowSpace(match)];
        if (!entry) {
            return match;
        }
        const entryId = entry.id || entry.refId;
        const skipLinking = !allowSameId && currentId && entryId === currentId;
        if (skipLinking) {
            return match;
        }
        if (entry.aoid) {
            let isInvocationAttribute = '';
            // Matches function-style invocation with parentheses and SDO-style 'of'
            // invocation. Exclude nodes which are outside of algorithms.
            if ((isInAlg === true || isInAlg === null) &&
                (content[offset + match.length] === '(' ||
                    (content[offset + match.length] === ' ' &&
                        content[offset + match.length + 1] === 'o' &&
                        content[offset + match.length + 2] === 'f'))) {
                if (isInAlg === null) {
                    let pointer = node;
                    while (pointer != null) {
                        if (pointer.nodeName === 'EMU-ALG') {
                            isInAlg = true;
                            break;
                        }
                        pointer = pointer.parentNode;
                    }
                    if (isInAlg === null) {
                        isInAlg = false;
                    }
                }
                if (isInAlg) {
                    isInvocationAttribute = ' is-invocation';
                }
            }
            let noAbruptCompletionAttribute = '';
            // \xA0 is &nbsp;
            if ((content[offset - 1] === ' ' || content[offset - 1] === '\xA0') &&
                content[offset - 2] === '!') {
                noAbruptCompletionAttribute = ' no-abrupt-completion';
            }
            return `<emu-xref aoid="${entry.aoid}"${isInvocationAttribute}${noAbruptCompletionAttribute}>${match}</emu-xref>`;
        }
        else {
            return `<emu-xref href="#${entry.id || entry.refId}">${match}</emu-xref>`;
        }
    });
    if (autolinked !== content) {
        template.innerHTML = autolinked;
        const newXrefNodes = utils.replaceTextNode(node, template.content);
        const newXrefs = newXrefNodes.map(node => new Xref_1.default(spec, node, clause, clause.namespace, node.getAttribute('href'), node.getAttribute('aoid')));
        spec._xrefs = spec._xrefs.concat(newXrefs);
    }
}
exports.autolink = autolink;
function replacerForNamespace(namespace, biblio) {
    const autolinkmap = biblio.getDefinedWords(namespace);
    const replacer = new RegExp(regexpPatternForAutolinkKeys(autolinkmap, Object.keys(autolinkmap), 0), 'g');
    return { replacer, autolinkmap };
}
exports.replacerForNamespace = replacerForNamespace;
function isCommonAbstractOp(op) {
    return op === 'Call' || op === 'Set' || op === 'Type' || op === 'UTC' || op === 'remainder';
}
function lookAheadBeyond(key, entry) {
    if (isCommonAbstractOp(key)) {
        // must be followed by parentheses
        return '(?=\\()';
    }
    if (entry.type !== 'term' || /^\w/.test(key)) {
        // must not be followed by a letter, `.word`, `%%`, `]]`
        return '(?!\\w|\\.\\w|%%|\\]\\])';
    }
    return '';
}
// returns a regexp string where each space can be many spaces or line breaks.
function widenSpace(str) {
    return str.replace(/\s+/g, '\\s+');
}
// replaces multiple whitespace characters with a single space
function narrowSpace(str) {
    return str.replace(/\s+/g, ' ');
}
function regexpEscape(str) {
    return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
function regexpUnion(alternatives) {
    var _a;
    if (alternatives.length < 2) {
        return `${(_a = alternatives[0]) !== null && _a !== void 0 ? _a : ''}`;
    }
    return `(?:${alternatives.join('|')})`;
}
// Search a non-empty array of string `items` for the longest common
// substring starting at position `beginIndex`. The part of each string
// before `beginIndex` is ignored, and is not included in the result.
function longestCommonPrefix(items, beginIndex = 0) {
    let endIndex = beginIndex;
    OUTER: while (endIndex < items[0].length) {
        const char = items[0][endIndex];
        for (let i = 1; i < items.length; ++i) {
            if (char !== items[i][endIndex]) {
                break OUTER;
            }
        }
        ++endIndex;
    }
    return items[0].slice(beginIndex, endIndex);
}
function regexpPatternForAutolinkKeys(autolinkmap, subsetKeys, initialCommonLength) {
    var _a;
    const resultAlternatives = [];
    const wordStartAlternatives = [];
    const groups = {};
    for (const key of subsetKeys) {
        const char = key[initialCommonLength];
        const group = ((_a = groups[char]) !== null && _a !== void 0 ? _a : (groups[char] = []));
        group.push(key);
    }
    const matchEmpty = '' in groups;
    if (matchEmpty) {
        delete groups[''];
    }
    const longestFirst = (a, b) => b.length - a.length;
    for (const groupChar of Object.keys(groups).sort()) {
        // sort by length to ensure longer keys are tested first
        const groupItems = groups[groupChar].sort(longestFirst);
        const prefix = longestCommonPrefix(groupItems, initialCommonLength);
        const prefixRegex = widenSpace(regexpEscape(prefix));
        const suffixPos = initialCommonLength + prefix.length;
        let suffixRegex;
        if (groupItems.length > 5) {
            // recursively split the group into smaller chunks
            suffixRegex = regexpPatternForAutolinkKeys(autolinkmap, groupItems, suffixPos);
        }
        else {
            suffixRegex = regexpUnion(groupItems.map(k => {
                const item = widenSpace(regexpEscape(k.slice(suffixPos)));
                return item + lookAheadBeyond(k, autolinkmap[k]);
            }));
        }
        if (initialCommonLength === 0 && /^\w/.test(prefix)) {
            wordStartAlternatives.push(prefixRegex + suffixRegex);
        }
        else {
            resultAlternatives.push(prefixRegex + suffixRegex);
        }
    }
    if (matchEmpty) {
        resultAlternatives.push('');
    }
    if (wordStartAlternatives.length) {
        resultAlternatives.unshift('\\b' + regexpUnion(wordStartAlternatives));
    }
    return regexpUnion(resultAlternatives);
}
//# sourceMappingURL=autolinker.js.map