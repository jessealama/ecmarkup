"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RHS_1 = require("./RHS");
const GrammarAnnotation_1 = require("./GrammarAnnotation");
const Terminal_1 = require("./Terminal");
const Builder_1 = require("./Builder");
const utils = require("./utils");
class Production extends Builder_1.default {
    constructor(spec, node, namespace) {
        super(spec, node);
        this.type = node.getAttribute('type');
        this.name = node.getAttribute('name'); // TODO: unchecked
        this.params = node.getAttribute('params');
        this.optional = node.hasAttribute('optional');
        this.oneOf = node.hasAttribute('oneof');
        this.rhses = [];
        this.rhsesById = {};
        this.namespace = namespace;
        const rhses = this.node.querySelectorAll('emu-rhs');
        for (let i = 0; i < rhses.length; i++) {
            const rhs = new RHS_1.default(this.spec, this, rhses[i]);
            this.rhses.push(rhs);
            if (rhs.alternativeId) {
                this.rhsesById[rhs.alternativeId] = rhs;
            }
        }
        const id = this._id();
        const entry = this.spec.biblio.byProductionName(this.name, this.namespace);
        let primary = false;
        if (node.hasAttribute('primary')) {
            primary = true;
        }
        else {
            const parent = utils.traverseWhile(node.parentElement, 'parentElement', 
            // highlighted nodes still count as primary unless they are being deleted (i.e. in a <del> tag)
            el => el.nodeName === 'INS' || el.nodeName === 'MARK');
            if (parent != null && parent.tagName === 'EMU-GRAMMAR') {
                primary = parent.hasAttribute('primary') || parent.getAttribute('type') === 'definition';
            }
        }
        this.primary = primary;
        if (this.primary) {
            this.id = id;
            if (entry && entry.namespace === this.namespace && entry._instance) {
                entry._instance.primary = false;
                entry._instance.node.removeAttribute('id');
            }
            const newEntry = {
                type: 'production',
                id,
                name: this.name,
            };
            // non-enumerable so JSON-stringifying the biblio doesn't include this
            Object.defineProperty(newEntry, '_instance', { value: this });
            this.spec.biblio.add(newEntry, this.namespace);
        }
    }
    _id() {
        if (this.namespace && this.namespace !== this.spec.namespace) {
            return `prod-${this.namespace}-${this.name}`;
        }
        else {
            return `prod-${this.name}`;
        }
    }
    static async enter({ spec, node, clauseStack }) {
        const ntNode = spec.doc.createElement('emu-nt');
        const clause = clauseStack[clauseStack.length - 1];
        const prod = new Production(spec, node, clause ? clause.namespace : spec.namespace);
        ntNode.innerHTML = '<a href="#prod-' + prod.name + '">' + prod.name + '</a>';
        if (prod.params)
            ntNode.setAttribute('params', prod.params);
        if (prod.optional)
            ntNode.setAttribute('optional', '');
        node.insertBefore(ntNode, node.children[0]);
        const geq = spec.doc.createElement('emu-geq');
        if (prod.type === 'lexical') {
            geq.textContent = '::';
        }
        else if (prod.type === 'regexp') {
            geq.textContent = ':::';
        }
        else {
            geq.textContent = ':';
        }
        node.insertBefore(spec.doc.createTextNode(' '), ntNode.nextSibling);
        node.insertBefore(geq, ntNode.nextSibling);
        node.insertBefore(spec.doc.createTextNode(' '), ntNode.nextSibling);
        if (prod.oneOf) {
            const elem = spec.doc.createElement('emu-oneof');
            elem.textContent = 'one of';
            node.insertBefore(elem, geq.nextSibling);
            node.insertBefore(spec.doc.createTextNode(' '), elem);
        }
        prod.rhses.forEach(rhs => rhs.build());
        const ganns = node.querySelectorAll('emu-gann');
        for (let i = 0; i < ganns.length; i++) {
            new GrammarAnnotation_1.default(spec, prod, ganns[i]).build();
        }
        const ts = node.querySelectorAll('emu-t');
        for (let i = 0; i < ts.length; i++) {
            new Terminal_1.default(spec, prod, ts[i]).build();
        }
        if (prod.primary) {
            node.setAttribute('id', prod.id);
        }
        if (utils.shouldInline(node)) {
            const cls = node.getAttribute('class') || '';
            if (cls.indexOf('inline') === -1) {
                node.setAttribute('class', cls + ' inline');
            }
        }
    }
}
/** @internal */ Production.byName = {};
Production.elements = ['EMU-PRODUCTION'];
exports.default = Production;
//# sourceMappingURL=Production.js.map