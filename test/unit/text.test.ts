/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { test, expect } from "vitest";

import { text as create } from "../../src/index.js";

const TEXT = `Hello world!`;
// includes markdown characters to test escaping
const TRICKY_TEXT = `Hello world!\nHello world! *~_~~_~*
\`\`\`json
{ "hello": "world" }
\`\`\``;

test(`Can make plain text`, () => {
    const text = create(TEXT);

    // t.is(text.toString(), TEXT);
    expect(text.toString()).toEqual(TEXT);
});

test(`Can make bold text`, () => {
    const text = create(TEXT);
    text.bold();

    expect(text.toString()).toEqual(`**${TEXT}**`);
});

test(`Can make italic text`, () => {
    const text = create(TEXT);
    text.italic();

    expect(text.toString()).toEqual(`*${TEXT}*`);
});

test(`Can make underline text`, () => {
    const text = create(TEXT);
    text.underline();

    expect(text.toString()).toEqual(`__${TEXT}__`);
});

test(`Can make strikethrough text`, () => {
    const text = create(TEXT);
    text.strikethrough();

    expect(text.toString()).toEqual(`~~${TEXT}~~`);
});

test(`Can make code text`, () => {
    const text = create(TEXT);
    text.code();

    expect(text.toString()).toEqual(`\`${TEXT}\``);
});

test(`Can make quote text`, () => {
    const text = create(TEXT);
    text.quote();

    expect(text.toString()).toEqual(`> ${TEXT}`);
});

test(`Can make multi line quote text`, () => {
    const text = create(TEXT + `\n` + TEXT);
    text.quote();

    expect(text.toString()).toEqual(`>>> ${TEXT + `\n` + TEXT}`);
});

test(`Can make bold, italic and underline text`, () => {
    const text = create(TEXT);
    text.bold();
    text.italic();
    text.underline();

    expect(text.toString()).toEqual(`__***${TEXT}***__`);
});

test(`Works in template literals`, () => {
    const text = create(TEXT);
    text.bold();
    text.italic();
    text.underline();

    expect(`${text}`).toEqual(`__***${TEXT}***__`);
});

test(`Can make text from object`, () => {
    const text = create({ hello: `world` });

    expect(`${text}`).toEqual(`\`\`\`\n{\n  "hello": "world"\n}\n\`\`\``);
});

test(`Can make text from a non-plain object`, () => {
    class Foo {
        bar: string;
        baz = true;

        constructor(barValue: string) {
            this.bar = barValue;
        }
    }

    const text = create(new Foo(`hello`));

    const value = text.toString();

    expect(value.includes(`Foo {`)).toBeTruthy();
    expect(value.includes(`"bar": "hello"`)).toBeTruthy();
    expect(value.includes(`"baz": true`)).toBeTruthy();
});

test(`Can take primitives`, () => {
    const primitives = [undefined, false, true, 0, 1];

    for (const prim of primitives) {
        const text = create(prim);

        expect(`${text}`).toEqual(`${prim}`);
    }
});

test(`Can be JSON.stringify'd`, () => {
    const text = create(TEXT);

    text.bold();
    text.italic();
    text.underline();

    expect(JSON.stringify(text)).toEqual(`"__***${TEXT}***__"`);
});

test(`Can make text from a Text`, () => {
    const text = create(TEXT);
    text.bold();
    text.italic();
    text.underline();

    const text2 = create(text);

    expect(`${text2}`).toEqual(`__***${TEXT}***__`);
});

test(`Does not alter formatting when a string or text is passed in`, () => {
    const text = create(TRICKY_TEXT);

    expect(`${text}`).toEqual(TRICKY_TEXT);
    expect(`${create(text)}`).toEqual(TRICKY_TEXT);

    expect(text.toString()).toEqual(TRICKY_TEXT);
    expect(create(text).toString()).toEqual(TRICKY_TEXT);

    expect(text.toJSON()).toEqual(TRICKY_TEXT);
    expect(create(text).toJSON()).toEqual(TRICKY_TEXT);
});
