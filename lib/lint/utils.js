"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectNonterminalsFromEmd = exports.collectNonterminalsFromGrammar = exports.getLocationInGrammarFile = exports.rhsMatches = exports.getProductions = void 0;
const grammarkdown_1 = require("grammarkdown");
const emd = require("ecmarkdown");
function getProductions(sourceFiles) {
    const productions = new Map();
    sourceFiles.forEach(f => f.elements.forEach(e => {
        if (e.kind !== grammarkdown_1.SyntaxKind.Production) {
            // The alternatives supported by Grammarkdown are imports and defines, which ecma-262 does not use.
            throw new Error('Grammar contains non-production node ' + JSON.stringify(e));
        }
        if (typeof e.body === 'undefined') {
            throw new Error('production lacks body ' + JSON.stringify(e));
        }
        if (!productions.has(e.name.text)) {
            productions.set(e.name.text, { production: e, rhses: [] });
        }
        productions.get(e.name.text).rhses.push(...productionBodies(e.body));
    }));
    return productions;
}
exports.getProductions = getProductions;
function productionBodies(body) {
    switch (body.kind) {
        case grammarkdown_1.SyntaxKind.RightHandSideList:
            return body.elements;
        case grammarkdown_1.SyntaxKind.OneOfList:
        case grammarkdown_1.SyntaxKind.RightHandSide:
            return [body];
        default:
            // @ts-expect-error
            throw new Error('unknown production body type ' + body.constructor.name);
    }
}
// these "matches" functions are not symmetric:
// the first parameter is permitted to omit flags and _opt nodes present on the second, but not conversely
function rhsMatches(a, b) {
    if (a.kind !== b.kind) {
        return false;
    }
    switch (a.kind) {
        case grammarkdown_1.SyntaxKind.RightHandSide: {
            const aHead = a.head;
            const bHead = b.head;
            if (aHead === undefined || bHead === undefined) {
                throw new Error('RHS must have content');
            }
            if (aHead.symbol.kind === grammarkdown_1.SyntaxKind.EmptyAssertion) {
                if (aHead.next !== undefined) {
                    throw new Error('empty assertions should not have other content');
                }
                return bHead.symbol.kind === grammarkdown_1.SyntaxKind.EmptyAssertion || canBeEmpty(bHead);
            }
            return symbolSpanMatches(aHead, bHead);
        }
        default:
            throw new Error('unknown rhs type ' + a.constructor.name);
    }
}
exports.rhsMatches = rhsMatches;
function symbolSpanMatches(a, b) {
    if (a === undefined) {
        return canBeEmpty(b);
    }
    if (a !== undefined && b !== undefined && symbolMatches(a.symbol, b.symbol)) {
        return symbolSpanMatches(a.next, b.next);
    }
    // sometimes when there is an optional terminal or nonterminal we give distinct implementations for each case, rather than one implementation which represents both
    // which means both `a b c` and `a c` must match `a b? c`
    // TODO reconsider whether ECMA-262 should have these
    if (b !== undefined && canSkipSymbol(b.symbol)) {
        return symbolSpanMatches(a, b.next);
    }
    return false;
}
function canBeEmpty(b) {
    return b === undefined || (canSkipSymbol(b.symbol) && canBeEmpty(b.next));
}
function canSkipSymbol(a) {
    return (a.kind === grammarkdown_1.SyntaxKind.NoSymbolHereAssertion ||
        a.kind === grammarkdown_1.SyntaxKind.LookaheadAssertion ||
        a.kind === grammarkdown_1.SyntaxKind.ProseAssertion ||
        a.questionToken !== undefined);
}
function symbolMatches(a, b) {
    if (a.kind !== b.kind) {
        return false;
    }
    switch (a.kind) {
        case grammarkdown_1.SyntaxKind.Terminal:
            return a.literal.text === b.literal.text;
        case grammarkdown_1.SyntaxKind.Nonterminal:
            if (a.argumentList !== undefined) {
                if (b.argumentList === undefined) {
                    return false;
                }
                if (!argumentListMatches(a.argumentList, b.argumentList)) {
                    return false;
                }
            }
            return a.name.text === b.name.text;
        case grammarkdown_1.SyntaxKind.ButNotSymbol:
            if (a.right === undefined || b.right === undefined) {
                throw new Error('"but not" production cannot be empty');
            }
            return (symbolMatches(a.left, b.left) &&
                symbolMatches(a.right, b.right));
        case grammarkdown_1.SyntaxKind.EmptyAssertion:
        case grammarkdown_1.SyntaxKind.LookaheadAssertion:
        case grammarkdown_1.SyntaxKind.ProseAssertion:
            return true;
        case grammarkdown_1.SyntaxKind.OneOfSymbol:
            if (a.symbols === undefined || b.symbols === undefined) {
                throw new Error('"one of" production cannot be empty');
            }
            return (a.symbols.length === b.symbols.length &&
                a.symbols.every((s, i) => symbolMatches(s, b.symbols[i])));
        default:
            throw new Error('unknown symbol type ' + a.constructor.name);
    }
}
function argumentListMatches(a, b) {
    if (a.elements === undefined || b.elements === undefined) {
        throw new Error('argument lists must have elements');
    }
    return (a.elements.length === b.elements.length &&
        a.elements.every((ae, i) => {
            const be = b.elements[i];
            if (ae.operatorToken === undefined || be.operatorToken === undefined) {
                throw new Error('arguments must have operators');
            }
            if (ae.name === undefined || be.name === undefined) {
                throw new Error('arguments must have names');
            }
            return ae.operatorToken.kind === be.operatorToken.kind && ae.name.text === be.name.text;
        }));
}
// this is only for use with single-file grammars
function getLocationInGrammarFile(file, pos) {
    const posWithoutWhitespace = (0, grammarkdown_1.skipTrivia)(file.text, pos, file.text.length);
    const { line: gmdLine, character: gmdCharacter } = file.lineMap.positionAt(posWithoutWhitespace);
    // grammarkdown use 0-based line and column, we want 1-based
    return { line: gmdLine + 1, column: gmdCharacter + 1 };
}
exports.getLocationInGrammarFile = getLocationInGrammarFile;
class CollectNonterminalsFromGrammar extends grammarkdown_1.NodeVisitor {
    constructor(grammar) {
        super();
        this.grammar = grammar;
        this.results = [];
    }
    visitProduction(node) {
        this.results.push({
            name: node.name.text,
            loc: getLocationInGrammarFile(this.grammar.sourceFiles[0], node.name.pos),
        });
        return super.visitProduction(node);
    }
    visitNonterminal(node) {
        this.results.push({
            name: node.name.text,
            loc: getLocationInGrammarFile(this.grammar.sourceFiles[0], node.name.pos),
        });
        return super.visitNonterminal(node);
    }
}
function collectNonterminalsFromGrammar(grammar) {
    const visitor = new CollectNonterminalsFromGrammar(grammar);
    grammar.rootFiles.forEach(f => {
        visitor.visitEach(f.elements);
    });
    return visitor.results;
}
exports.collectNonterminalsFromGrammar = collectNonterminalsFromGrammar;
function collectNonterminalsFromEmd(emdNode) {
    if (Array.isArray(emdNode)) {
        return emdNode.flatMap(collectNonterminalsFromEmd);
    }
    const results = [];
    emd.visit(emdNode, {
        enter(emdNode) {
            if (emdNode.name === 'pipe') {
                results.push({
                    name: emdNode.nonTerminal,
                    loc: {
                        line: emdNode.location.start.line,
                        column: emdNode.location.start.column + 1, // skip the pipe
                    },
                });
            }
        },
    });
    return results;
}
exports.collectNonterminalsFromEmd = collectNonterminalsFromEmd;
//# sourceMappingURL=utils.js.map