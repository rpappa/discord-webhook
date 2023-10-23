import isPlainObject from "lodash.isplainobject";
import { format as prettyFormat } from "pretty-format";

// eslint-disable-next-line @typescript-eslint/ban-types
function isPrimitive(value: unknown): value is number | boolean | string | symbol | null | undefined {
    return (
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "string" ||
        typeof value === "symbol" ||
        value === null ||
        value === undefined
    );
}

/**
 * A class that represents text that can be formatted in markdown.
 *
 * Non-strings passed as values will be converted to strings.
 */
export class Text {
    private readonly valueToFormat: unknown;

    private isBold = false;
    private isItalic = false;
    private isUnderline = false;
    private isStrikeThrough = false;

    private isCode = false;
    private isQuote = false;

    private multilineOverride?: boolean;

    /**
     * Text takes any value and converts it to markdown text
     */
    constructor(value: unknown) {
        this.valueToFormat = value;
    }

    bold(isBold = true) {
        this.isBold = isBold;
        return this;
    }

    // setters for italic, underline, strikethrough
    italic(isItalic = true) {
        this.isItalic = isItalic;
        return this;
    }

    underline(isUnderline = true) {
        this.isUnderline = isUnderline;
        return this;
    }

    strikethrough(isStrikeThrough = true) {
        this.isStrikeThrough = isStrikeThrough;
        return this;
    }

    code(isCode = true) {
        this.isCode = isCode;
        return this;
    }

    quote(isQuote = true) {
        this.isQuote = isQuote;
        return this;
    }

    forceMultiline(force = true) {
        this.multilineOverride = force;
        return this;
    }

    autoMultiline() {
        this.multilineOverride = undefined;
        return this;
    }

    toString() {
        let str = this.format();
        if (this.isItalic) {
            str = `*${str}*`;
        }

        if (this.isBold) {
            str = `**${str}**`;
        }

        if (this.isUnderline) {
            str = `__${str}__`;
        }

        if (this.isStrikeThrough) {
            str = `~~${str}~~`;
        }

        const isMultiLine = this.multilineOverride ?? str.includes(`\n`);
        if (this.isQuote) {
            str = isMultiLine ? `>>> ${str}` : `> ${str}`;
        }

        if (this.isCode) {
            str = isMultiLine ? `\`\`\`\n${str}\n\`\`\`` : `\`${str}\``;
        }

        return str;
    }

    toJSON() {
        return this.toString();
    }

    private format() {
        let formatted = ``;
        // at the end, handle boolean, number, undefined etc with template literals
        if (isPrimitive(this.valueToFormat)) {
            formatted = String(this.valueToFormat);
        } else if (this.valueToFormat instanceof Text) {
            formatted = this.valueToFormat.toString();
        } else if (isPlainObject(this.valueToFormat)) {
            this.code(true);
            formatted = JSON.stringify(this.valueToFormat, undefined, 2);
        } else {
            this.code(true);
            formatted = prettyFormat(this.valueToFormat);
        }

        return formatted;
    }
}
