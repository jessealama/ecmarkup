export declare const options: readonly [{
    readonly name: "help";
    readonly alias: "h";
    readonly type: BooleanConstructor;
    readonly description: "Display this help message";
}, {
    readonly name: "watch";
    readonly alias: "w";
    readonly type: BooleanConstructor;
    readonly description: "Rebuild when files change";
}, {
    readonly name: "load-biblio";
    readonly type: StringConstructor;
    readonly lazyMultiple: true;
    readonly typeLabel: "{underline path}";
    readonly description: "An external biblio.json to load; either a path prefixed with \".\" or \"./\", or a package name of an installed package that exports a biblio";
}, {
    readonly name: "write-biblio";
    readonly type: StringConstructor;
    readonly typeLabel: "{underline file}";
    readonly description: "Path to where the biblio.json should be written";
}, {
    readonly name: "assets";
    readonly type: StringConstructor;
    readonly typeLabel: "none|inline|external";
    readonly description: "Omit assets, inline them, or add them as external. Default: inline, unless --multipage or --assets-dir are specified, in which case external.";
}, {
    readonly name: "assets-dir";
    readonly type: StringConstructor;
    readonly typeLabel: "{underline dir}";
    readonly description: "The directory in which to place generated assets when using --assets=external. Implies --assets=external. Defaults to [outfile]/assets.";
}, {
    readonly name: "no-toc";
    readonly type: BooleanConstructor;
    readonly description: "Don't include the table of contents";
}, {
    readonly name: "old-toc";
    readonly type: BooleanConstructor;
    readonly description: "Use the old table of contents styling";
}, {
    readonly name: "mark-effects";
    readonly type: BooleanConstructor;
    readonly description: "Render markers for effects like \"user code\" [UC]";
}, {
    readonly name: "lint-spec";
    readonly type: BooleanConstructor;
    readonly description: "Enforce some style and correctness checks";
}, {
    readonly name: "error-formatter";
    readonly type: StringConstructor;
    readonly typeLabel: "{underline formatter}";
    readonly defaultValue: "eslint-formatter-codeframe";
    readonly description: "The formatter for warnings and errors; either a path prefixed with \".\" or \"./\", or package name, of an installed eslint compatible formatter (default: eslint-formatter-codeframe)";
}, {
    readonly name: "multipage";
    readonly type: BooleanConstructor;
    readonly description: "Generate a multipage version of the spec. Implies --assets=external.";
}, {
    readonly name: "strict";
    readonly type: BooleanConstructor;
    readonly description: "Exit with an error if there are warnings. Cannot be used with --watch.";
}, {
    readonly name: "verbose";
    readonly type: BooleanConstructor;
    readonly description: "Display document build progress";
}, {
    readonly name: "version";
    readonly alias: "v";
    readonly type: BooleanConstructor;
    readonly description: "Display version info";
}, {
    readonly name: "files";
    readonly type: StringConstructor;
    readonly multiple: true;
    readonly defaultOption: true;
}, {
    readonly name: "css-out";
    readonly type: StringConstructor;
}, {
    readonly name: "js-out";
    readonly type: StringConstructor;
}];
//# sourceMappingURL=args.d.ts.map