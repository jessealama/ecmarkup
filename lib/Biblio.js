"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeys = void 0;
class EnvRec {
    constructor(parent, namespace) {
        this.entries = [];
        this._parent = parent;
        this._children = [];
        if (this._parent) {
            this._parent._children.push(this);
        }
        this._namespace = namespace;
        this._byType = {};
        this._byLocation = {};
        this._byProductionName = {};
        this._byAoid = {};
        this._keys = new Set();
    }
    // this mutates each item to fill in missing properties
    push(...items) {
        for (const item of items) {
            pushKey(this._byType, item.type, item);
            pushKey(this._byLocation, item.location, item);
            if (item.type === 'op') {
                this._byAoid[item.aoid] = item;
                this._keys.add(item.aoid);
            }
            if (item.type === 'production') {
                this._byProductionName[item.name] = item;
            }
            if (item.type === 'term') {
                for (const key of getKeys(item)) {
                    this._keys.add(key);
                }
            }
        }
        return this.entries.push(...items);
    }
}
class Biblio {
    constructor(location) {
        this._byId = {};
        this._location = location;
        // the root namespace holds names defined in external biblios
        this._root = new EnvRec(undefined, 'external');
        this._nsToEnvRec = {
            // @ts-ignore https://github.com/microsoft/TypeScript/issues/38385
            __proto__: null,
            external: this._root,
        };
        this.createNamespace(location, 'external');
    }
    byId(id) {
        return this._byId[id];
    }
    byNamespace(ns) {
        const env = this._nsToEnvRec[ns];
        if (!env) {
            throw new Error('Namespace ' + ns + ' not found');
        }
        return env;
    }
    byProductionName(name, ns) {
        ns = ns || this._location;
        return this.lookup(ns, env => env._byProductionName[name]);
    }
    byAoid(aoid, ns) {
        ns = ns || this._location;
        return this.lookup(ns, env => env._byAoid[aoid]);
    }
    getOpNames(ns) {
        const out = new Set();
        let current = this._nsToEnvRec[ns];
        while (current) {
            const entries = current._byType['op'] || [];
            for (const entry of entries) {
                out.add(entry.aoid);
            }
            current = current._parent;
        }
        return out;
    }
    getDefinedWords(ns) {
        const result = Object.create(null);
        for (const type of ['term', 'op']) {
            // note that the `seen` set is not shared across types
            // this is dumb but is the current semantics: ops always clobber terms
            const seen = new Set();
            let current = this._nsToEnvRec[ns];
            while (current) {
                const entries = current._byType[type] || [];
                for (const entry of entries) {
                    let keys;
                    if (type === 'term') {
                        if (entry.term === 'type') {
                            // this is a dumb kludge necessitated by ecma262 dfn'ing both "type" and "Type"
                            // the latter originally masked the former, so that it didn't actually end up linking all usages of the word "type"
                            // we've changed the logic a bit so that masking no longer happens, and consequently the autolinker adds a bunch of spurious links
                            // this can be removed once ecma262 no longer dfn's it and we update ecma262-biblio.json
                            continue;
                        }
                        keys = getKeys(entry).flatMap(key => {
                            if (/^[a-z]/.test(key)) {
                                // include capitalized variant of words starting with lowercase letter
                                return [key, key[0].toUpperCase() + key.slice(1)];
                            }
                            return key;
                        });
                    }
                    else {
                        keys = [entry.aoid];
                    }
                    for (const key of keys) {
                        if (!seen.has(key)) {
                            seen.add(key);
                            result[key] = entry;
                        }
                    }
                }
                current = current._parent;
            }
        }
        return result;
    }
    lookup(ns, cb) {
        let env = this._nsToEnvRec[ns];
        if (!env) {
            throw new Error('Namespace ' + ns + ' not found');
        }
        while (env) {
            const result = cb(env);
            if (result) {
                return result;
            }
            env = env._parent;
        }
        return undefined;
    }
    /** @internal*/
    add(entry, ns) {
        ns = ns || this._location;
        const env = this._nsToEnvRec[ns];
        // @ts-ignore
        entry.namespace = ns;
        // @ts-ignore
        entry.location = entry.location || '';
        // @ts-ignore
        entry.referencingIds = entry.referencingIds || [];
        if (entry.id) {
            // no reason to have both
            delete entry.refId;
        }
        env.push(entry);
        if (entry.id) {
            if ({}.hasOwnProperty.call(this, entry.id)) {
                throw new Error('Duplicate biblio entry ' + JSON.stringify(entry.id) + '.');
            }
            this._byId[entry.id] = entry;
        }
    }
    /** @internal*/
    createNamespace(ns, parent) {
        const existingNs = this._nsToEnvRec[ns];
        if (existingNs) {
            if (existingNs._parent._namespace === parent) {
                return;
            }
            else {
                throw new Error('Namespace ' + ns + ' already in use.');
            }
        }
        if (!parent) {
            throw new Error('Cannot create namespace without parent');
        }
        const parentEnv = this._nsToEnvRec[parent];
        if (!parentEnv) {
            throw new Error('Cannot find namespace with name ' + parent);
        }
        if (!ns) {
            throw new Error('Cannot create namespace without a name');
        }
        const env = new EnvRec(parentEnv, ns);
        this._nsToEnvRec[ns] = env;
    }
    keysForNamespace(ns) {
        return this._nsToEnvRec[ns]._keys;
    }
    // returns the entries from the local namespace
    localEntries() {
        let root = [];
        function addEnv(env) {
            root = root.concat(env.entries);
            env._children.forEach(addEnv);
        }
        addEnv(this.byNamespace(this._location));
        return root;
    }
    /** @internal*/
    addExternalBiblio(biblio) {
        for (const item of biblio.entries) {
            this.add({ location: biblio.location, ...item }, 'external');
        }
    }
    export() {
        return {
            location: this._location,
            entries: this.byNamespace(this._location).entries.map(e => {
                const copy = { ...e };
                // @ts-ignore
                delete copy.namespace;
                // @ts-ignore
                delete copy.location;
                // @ts-ignore
                delete copy.referencingIds;
                // @ts-ignore
                delete copy._node;
                return copy;
            }),
        };
    }
    dump() {
        dumpEnv(this._root);
    }
}
exports.default = Biblio;
function dumpEnv(env) {
    console.log('## ' + env._namespace);
    console.log(env.entries.map(entry => JSON.stringify(entry)).join(', '));
    env._children.forEach(child => {
        dumpEnv(child);
    });
}
function pushKey(arr, key, value) {
    if (arr[key] === undefined) {
        arr[key] = [];
    }
    arr[key].push(value);
}
function getKeys(entry) {
    return [entry.term, ...(entry.variants || [])].map(v => v.replace(/\s+/g, ' '));
}
exports.getKeys = getKeys;
//# sourceMappingURL=Biblio.js.map