/* eslint-disable @typescript-eslint/ban-ts-comment */
import { test, expect, beforeEach, afterEach } from "vitest";

import { Embed } from "../../src/index.js";

const IMAGE_URL = `https://picsum.photos/200`;

let previousFallback = process.env[`FALLBACK_IMAGE_URL`];

beforeEach(() => {
    previousFallback = process.env[`FALLBACK_IMAGE_URL`];
    // delete process.env[`FALLBACK_IMAGE_URL`];
    process.env[`FALLBACK_IMAGE_URL`] = undefined;
});

afterEach(() => {
    process.env[`FALLBACK_IMAGE_URL`] = previousFallback;
});

test(`Transforms non textish values for title`, () => {
    const embed = new Embed();
    embed.setTitle(123);

    expect(JSON.stringify(embed)).toBe(`{"title":"123"}`);
});

test(`Transforms non textish values for description`, () => {
    const embed = new Embed();
    const obj = {
        foo: `bar`,
        test: 123,
    };
    embed.setDescription(obj);

    expect(JSON.stringify(embed)).toBe(
        JSON.stringify({
            description: `\`\`\`\n${JSON.stringify(obj, undefined, 2)}\n\`\`\``,
        })
    );
});

test(`SetURL a no-op for an invalid url`, () => {
    const embed = new Embed();
    embed.setURL(`not a url`);

    expect(JSON.stringify(embed)).toBe(`{}`);
});

test(`Transforms numbers to timestamps`, () => {
    const embed = new Embed();
    const now = Date.now();

    embed.setTimestamp(now);

    expect(JSON.stringify(embed)).toBe(`{"timestamp":"${new Date(now).toISOString()}"}`);
});

test(`Is a no-op for invalid dates`, () => {
    const embed = new Embed();
    embed.setTimestamp(`not a date`);

    expect(JSON.stringify(embed)).toBe(`{}`);
});

test(`Is a no-op for dates that throw`, () => {
    const embed = new Embed();
    // @ts-expect-error - testing invalid dates
    embed.setTimestamp({ foo: `bar` });

    expect(JSON.stringify(embed)).toBe(`{}`);
});

test(`Sets footer even with an invalid image url`, () => {
    const embed = new Embed();
    embed.setFooter(`test`, `not a url`);

    expect(JSON.stringify(embed)).toBe(`{"footer":{"text":"test"}}`);
});

test(`Does not fallback to an image url in footer if no icon url is provided`, () => {
    const embed = new Embed(IMAGE_URL);
    embed.setFooter(`test`);

    expect(JSON.stringify(embed)).toBe(`{"footer":{"text":"test"}}`);
});

test(`Transforms an invalid image URL to the fallback in the footer`, () => {
    const embed = new Embed(IMAGE_URL);
    embed.setFooter(`test`, `not a url`);
    expect(JSON.stringify(embed)).toBe(`{"footer":{"text":"test","icon_url":"${IMAGE_URL}"}}`);
});

test(`Is a no-op for an invalid image url with no fallback`, () => {
    const previous = process.env[`FALLBACK_IMAGE_URL`];
    process.env[`FALLBACK_IMAGE_URL`] = undefined;

    const embed = new Embed();
    embed.setImage(`not a url`);

    process.env[`FALLBACK_IMAGE_URL`] = previous;

    expect(JSON.stringify(embed)).toBe(`{}`);
});

test(`Transforms an invalid image URL to the fallback`, () => {
    const embed = new Embed(IMAGE_URL);
    embed.setImage(`not a url`);

    expect(JSON.stringify(embed)).toBe(`{"image":{"url":"${IMAGE_URL}"}}`);
});

test(`Transforms an invalid image URL to the fallback environment variable`, () => {
    process.env[`FALLBACK_IMAGE_URL`] = IMAGE_URL;

    const embed = new Embed();
    embed.setImage(`not a url`);

    expect(JSON.stringify(embed)).toBe(`{"image":{"url":"${IMAGE_URL}"}}`);
});

test(`Transforms an invalid thumnail URL to the fallback`, () => {
    const embed = new Embed(IMAGE_URL);
    embed.setThumbnail(`not a url`);

    expect(JSON.stringify(embed)).toBe(`{"thumbnail":{"url":"${IMAGE_URL}"}}`);
});

test(`Removes an invalid author URL`, () => {
    const embed = new Embed();
    embed.setAuthor(`test`, `not a url`);

    expect(JSON.stringify(embed)).toBe(`{"author":{"name":"test"}}`);
});

test(`Removes an invalid author icon URL`, () => {
    const embed = new Embed();
    embed.setAuthor(`test`, `https://example.com`, `not a url`);

    expect(JSON.stringify(embed)).toBe(`{"author":{"name":"test","url":"https://example.com"}}`);
});

test(`Uses a fallback image for an invalid author icon URL`, () => {
    const embed = new Embed(IMAGE_URL);
    embed.setAuthor(`test`, undefined, `not a url`);

    expect(JSON.stringify(embed)).toBe(`{"author":{"name":"test","icon_url":"${IMAGE_URL}"}}`);
});

test(`Transforms non textish values for fields`, () => {
    const embed = new Embed();
    // @ts-expect-error - testing non textish values for fields
    embed.addField(123, undefined);

    expect(JSON.stringify(embed)).toBe(`{"fields":[{"name":"123","value":"undefined"}]}`);
});

test(`Can add fields from an object`, () => {
    const embed = new Embed();
    embed.addFieldsObj({
        a: `test`,
        b: 123,
    });

    expect(JSON.stringify(embed)).toBe(`{"fields":[{"name":"a","value":"test"},{"name":"b","value":"123"}]}`);
});
