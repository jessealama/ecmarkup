export declare class LineBuilder {
    indent: number;
    firstLineIsPartial: boolean;
    lines: string[];
    constructor(indent: number);
    append(other: LineBuilder): void;
    appendText(text: string, allowMultiSpace?: boolean): void;
    appendLine(text: string, allowMultiSpace?: boolean): void;
    linebreak(): void;
    isEmpty(): boolean;
    trim(): void;
    get last(): string;
    set last(o: string);
    private needsIndent;
}
//# sourceMappingURL=line-builder.d.ts.map