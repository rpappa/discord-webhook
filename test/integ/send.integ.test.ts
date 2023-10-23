import "dotenv/config";

import { test as defaultTest, expect } from "vitest";

import { Embed, Message, Webhook } from "../../src/index.js";
import { everythingEmbed, everythingMultiLineEmbed } from "../helpers/embeds.js";

const hookUrl = process.env[`WEBHOOK_URL`];
if (!hookUrl) {
    throw new Error(`WEBHOOK_URL is not set in the environment, and is required for intergration tests`);
}

interface TestContext {
    hook: Webhook;
    hookUrl: string;
}

const test = defaultTest.extend<TestContext>({
    hookUrl,
    async hook({ hookUrl }, use) {
        await use(new Webhook(hookUrl));
    },
});

test(`Send should not error out sending a text message`, async ({ hook }) => {
    const message = new Message();
    message.setContent(`Hello world!`);

    await hook.send(message);
});

test(`Send should not error out sending an embed`, async ({ hook }) => {
    const message = new Message();
    const embed = new Embed();

    embed.setDescription(`Hello world!`);
    message.addEmbed(embed);

    await hook.send(message);
});

test(`Send should not error out sending a fully featured embed`, async ({ hook }) => {
    const message = new Message();

    message.setUsername(`Test User`);
    message.setAvatarURL(`https://picsum.photos/200`);
    message.setTTS(true);

    const embed = everythingEmbed();

    message.addEmbed(embed);

    await hook.send(message);
});

test(`Should error out sending an empty message`, async ({ hook }) => {
    const message = new Message();

    await expect(hook.send(message)).rejects.toThrowError();
});

test(`Should return error when sending an empty message if not throwing`, async () => {
    const message = new Message();

    const hook = new Webhook({
        url: hookUrl,
        throwErrors: false,
    });

    await hook.send(message);
});

test(`Should not error out sending both description and embed`, async ({ hook }) => {
    const message = new Message();

    message.setContent(`Hello world!`);
    message.addEmbed(everythingEmbed());

    await hook.send(message);
});

test(`Can send embeds, strings, or anything by itself`, async ({ hook }) => {
    const embed = everythingEmbed();
    const string = `Hello world!`;
    const object = { hello: `world` };

    await hook.send(embed);
    await hook.send(string);
    // @ts-expect-error - Makes it safer to call in javascript
    await hook.send(object);
});

test(`Send should not error out sending a fully featured embed, even with multiple lines`, async ({ hook }) => {
    const message = new Message();
    const embed = everythingMultiLineEmbed();

    message.addEmbed(embed);

    await hook.send(message);
});

test(`Can send multiple embeds`, async ({ hook }) => {
    const message = new Message();

    message.setEmbeds([everythingEmbed(), everythingEmbed()]);

    await hook.send(message);
});

test(`Handles rate limits`, async ({ hook }) => {
    // Limit should be hit after 30+ messages, but we'll do 50 to be safe

    const allPromises: Array<Promise<symbol>> = [];
    for (let i = 0; i < 50; i++) {
        const message = new Message();
        message.setContent(`Rate limit test, message #${i + 1}`);

        allPromises.push(hook.send(message));
    }

    await Promise.all(allPromises);

    const messagesSent = await new Promise<number>((resolve) => {
        hook.on(`queueEmpty`, (queuedMessagesSent) => {
            resolve(queuedMessagesSent);
        });
    });

    expect(messagesSent).toBeGreaterThanOrEqual(45);
}, 120_000);

test(`Does not handle rate limits if told not to`, async () => {
    const hook = new Webhook({
        url: hookUrl,
        retryOnLimit: false,
        throwErrors: false,
    });

    const allPromises: Array<Promise<symbol>> = [];
    for (let i = 0; i < 50; i++) {
        const message = new Message();
        message.setContent(`Rate limit no-handle test, message #${i + 1}`);

        allPromises.push(hook.send(message));
    }

    await Promise.all(allPromises);

    const results = await Promise.all(allPromises);

    expect(results.every((result) => result !== Webhook.QUEUED)).toBe(true);
    expect(results.includes(Webhook.ERROR)).toBe(true);
});

test(`Can use message convenience methods`, async ({ hook }) => {
    await hook.message().addEmbed(everythingEmbed()).send();
});

test(`Can use embed convenience methods`, async ({ hook }) => {
    await hook.embed().setDescription(`Hello world!`).send();
});
