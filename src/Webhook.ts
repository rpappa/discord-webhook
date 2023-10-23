import EventEmitter from "node:events";

// eslint-disable-next-line import/no-named-as-default
import got, { HTTPError } from "got";
// https://github.com/andywer/typed-emitter/issues/39
import { type EventMap } from "typed-emitter";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
type TypedEventEmitter<Events extends EventMap> = import("typed-emitter").default<Events>;

import { Embed } from "./Embed.js";
import { Message } from "./Message.js";
import { Text } from "./Text.js";

export interface WebhookOptions {
    url: string;
    throwErrors?: boolean;
    retryOnLimit?: boolean;
    fallbackImageUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type WebhookEvents = {
    queueEmpty: (queuedMessagesSent: number) => void;
    rateLimited: () => void;
    errorOnDequeue: (error: unknown, message: Message) => void;
};

// There is probably a more "generic" way to do these two Attached classes

/**
 * An embed that can be sent. It is attached to a webhook through an attached message.
 */
class AttachedEmbed extends Embed {
    private readonly message: AttachedMessage;

    constructor(message: AttachedMessage, fallbackImageUrl?: string) {
        super(fallbackImageUrl);
        this.message = message;
    }

    /**
     * Send the message that this embed is attached to.
     * @returns The result of sending the message that this embed is attached to.
     */
    async send() {
        return this.message.addEmbed(this).send();
    }
}

/**
 * A message that can be sent. It is attached to a webhook.
 */
class AttachedMessage extends Message {
    private readonly webhook: Webhook;
    private readonly fallbackImageUrl?: string;

    constructor(webhook: Webhook, fallbackImageUrl?: string) {
        super();
        this.webhook = webhook;
        this.fallbackImageUrl = fallbackImageUrl;
    }

    /**
     * Create an embed that can be sent. It is attached to this message, which is attached to the webhook.
     */
    embed() {
        return new AttachedEmbed(this, this.fallbackImageUrl);
    }

    /**
     * Send this message via the webhook it is attached to.
     * @returns The result of sending this message.
     */
    async send() {
        return this.webhook.send(this);
    }
}

export class Webhook extends (EventEmitter as new () => TypedEventEmitter<WebhookEvents>) {
    static QUEUED = Symbol(`Queued`);
    static SENT = Symbol(`Sent`);
    static ERROR = Symbol(`Error`);

    private readonly options: WebhookOptions;

    private readonly queue: Message[];
    private queuedMessagesSent = 0;
    private dequeuePending = false;

    constructor(options: string | WebhookOptions) {
        super();

        this.options =
            typeof options === `string`
                ? {
                      url: options,
                      throwErrors: true,
                      retryOnLimit: true,
                  }
                : options;

        this.queue = [];
    }

    /**
     * @returns A message that can be sent. It is attached to this webhook.
     */
    message() {
        return new AttachedMessage(this, this.options.fallbackImageUrl);
    }

    /**
     * @returns An embed that can be sent. It is attached to a message that is attached to this webhook.
     */
    embed() {
        const message = new AttachedMessage(this, this.options.fallbackImageUrl);
        return message.embed();
    }

    /**
     * Send a message via this webhook.
     * @param message The message to send. Can be a string, a Message, or an Embed.
     * @returns The result of sending the message. Can be `Webhook.QUEUED`, `Webhook.SENT`, or `Webhook.ERROR`.
     * If `Webhook.QUEUED`, the message will be sent later.
     * If `Webhook.SENT`, the message was sent successfully.
     * If `Webhook.ERROR`, the message was not sent successfully. If `options.throwErrors` is true, an error will be thrown
     * instead.
     */
    async send(message: Message | Embed | string) {
        let messageToSend: Message;

        if (message instanceof Message) {
            messageToSend = message;
        } else if (message instanceof Embed) {
            messageToSend = new Message().setEmbeds([message]);
        } else {
            messageToSend = new Message().setContent(new Text(message));
        }

        if (messageToSend.isEmpty()) {
            if (this.options.throwErrors) {
                throw new Error(`Cannot send an empty message`);
            }

            return Webhook.ERROR;
        }

        return this.sendMessage(messageToSend);
    }

    private async sendMessage(message: Message) {
        try {
            await got.post(this.options.url, {
                json: message,
            });

            return Webhook.SENT;
        } catch (error) {
            if (error instanceof HTTPError && error.response.statusCode === 429 && this.options.retryOnLimit) {
                this.emit(`rateLimited`);
                let retryAfter: undefined | number;
                try {
                    const responseBody = JSON.parse(error.response.body as string) as { retry_after: number };
                    retryAfter = responseBody.retry_after;
                } catch {}

                const retryAfterHeader = error.response.headers[`retry-after`];
                if (!retryAfter && retryAfterHeader) {
                    const parsed = Number.parseInt(retryAfterHeader);
                    if (!Number.isNaN(parsed)) {
                        retryAfter = parsed;
                    }
                }

                this.queue.push(message);

                if (!this.dequeuePending) {
                    this.dequeuePending = true;
                    if (retryAfter) {
                        setTimeout(async () => this.drainQueue(), retryAfter * 1000);
                    } else {
                        // We don't know how long to wait, so we'll just wait 30 seconds
                        setTimeout(async () => this.drainQueue(), 30 * 1000);
                    }
                }

                return Webhook.QUEUED;
            }

            if (this.options.throwErrors) {
                throw error;
            }

            return Webhook.ERROR;
        }
    }

    /**
     * Takes the top message off the queue and tries to send it.
     */
    private async drainQueue() {
        this.dequeuePending = false;
        const top = this.queue.shift();

        if (top) {
            try {
                const result = await this.send(top);
                this.queuedMessagesSent++;

                if (result === Webhook.QUEUED) {
                    // We are now done, since `send` handles re-queueing
                    // It's also possible another message got sent in the meantime,
                    // and a dequeue is already pending.
                } else if (result === Webhook.ERROR) {
                    // Throw and handle the same (at this point, we don't care about throwErrors)
                    throw new Error(`Error sending message`);
                } else if (!this.dequeuePending) {
                    // We sent the message, so we can drain the queue again
                    await this.drainQueue();
                }
            } catch (error) {
                this.emit(`errorOnDequeue`, error, top);
                if (!this.dequeuePending) {
                    await this.drainQueue();
                }
            }
        } else {
            this.emit(`queueEmpty`, this.queuedMessagesSent);
            this.queuedMessagesSent = 0;
        }
    }
}
