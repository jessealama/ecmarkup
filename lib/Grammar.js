"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Builder_1 = require("./Builder");
const utils_1 = require("./lint/utils");
const grammarkdown_1 = require("grammarkdown");
const endTagRe = /<\/?(emu-\w+|h?\d|p|ul|table|pre|code)\b[^>]*>/i;
const globalEndTagRe = /<\/?(emu-\w+|h?\d|p|ul|table|pre|code)\b[^>]*>/gi;
class Grammar extends Builder_1.default {
    static async enter({ spec, node, clauseStack }) {
        if ('grammarkdownOut' in node) {
            // i.e., we already parsed this during an earlier phase
            node.innerHTML = node.grammarkdownOut;
            return;
        }
        // fetch the original source text and source DOM for the node.
        // walk up the current DOM as this may come from an import.
        const location = spec.locate(node);
        let content;
        let possiblyMalformed = true;
        // If the source text is available, we should use it since `innerHTML` serializes the
        // DOM tree beneath the node. This can result in odd behavior when the syntax is malformed
        // in a way that parse5 does not understand, but grammarkdown could possibly recover.
        if (location) {
            if (location.startTag && location.endTag) {
                // the parser was able to find a matching end tag.
                const start = location.startTag.endOffset;
                const end = location.endTag.startOffset;
                content = location.source.slice(start, end);
            }
            else {
                // TODO this is not reached
                // the parser was *not* able to find a matching end tag. Try to recover by finding a
                // possible end tag, otherwise read the rest of the source text.
                const start = (globalEndTagRe.lastIndex = location.endOffset);
                const match = globalEndTagRe.exec(location.source);
                const end = match ? match.index : location.source.length;
                content = location.source.slice(start, end);
                // since we already tested for an end tag, no need to test again later.
                possiblyMalformed = false;
                globalEndTagRe.lastIndex = 0;
            }
        }
        else {
            // no source text, so read innerHTML as a fallback.
            content = node.innerHTML.replace(/&gt;/g, '>');
        }
        if (possiblyMalformed) {
            // check for a possible end-tag in the content. For now we only check for a few possible
            // recovery cases, namely emu-* tags, and a few block-level elements.
            const match = endTagRe.exec(content);
            if (match) {
                content = content.slice(0, match.index);
            }
        }
        const options = {
            format: grammarkdown_1.EmitFormat.ecmarkup,
            noChecks: true,
        };
        const grammarHost = grammarkdown_1.CoreAsyncHost.forFile(content);
        const grammar = new grammarkdown_1.Grammar([grammarHost.file], options, grammarHost);
        await grammar.parse();
        if (spec.opts.lintSpec && spec.locate(node) != null && !node.hasAttribute('example')) {
            // Collect referenced nonterminals to check definedness later
            // The `'grammarkdownOut' in node` check at the top means we don't do this for nodes which have already been covered by a separate linting pass
            const clause = clauseStack[clauseStack.length - 1];
            const namespace = clause ? clause.namespace : spec.namespace;
            const nonterminals = (0, utils_1.collectNonterminalsFromGrammar)(grammar).map(({ name, loc }) => ({
                name,
                loc,
                node,
                namespace,
            }));
            spec._ntStringRefs = spec._ntStringRefs.concat(nonterminals);
        }
        await grammar.emit(undefined, (file, source) => {
            if (grammar.rootFiles.length !== 1) {
                throw new Error(`grammarkdown file count mismatch: ${grammar.rootFiles.length}. This is a bug in ecmarkup; please report it.`);
            }
            node.innerHTML = source;
            node.grammarkdownOut = source;
            node.grammarSource = grammar.rootFiles[0];
        });
    }
}
Grammar.elements = ['EMU-GRAMMAR'];
exports.default = Grammar;
//# sourceMappingURL=Grammar.js.map