export type Reporter = (lintingError: LintingError) => void;
export type LintingError = {
    ruleId: string;
    message: string;
    line: number;
    column: number;
};
//# sourceMappingURL=algorithm-error-reporter-type.d.ts.map