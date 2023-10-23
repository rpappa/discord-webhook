import { Text } from "./Text.js";
import { validateUrl } from "./util/validation.js";

import type { Embed } from "./Embed.js";

type AllowedMentionType = "roles" | "users" | "everyone";

interface AllowedMention {
    parse: AllowedMentionType[];
    roles: string[];
    users: string[];
    replied_user: boolean;
}

interface DiscordWebhookMessage {
    content?: string | Text;
    username?: string;
    avatar_url?: string;
    tts?: boolean;
    embeds?: Embed[];
    allowed_mentions?: AllowedMention;
    // files TODO
    // payload_json TODO
    // attachments TODO
    flags?: number;
    thread_name?: string;
}

export class Message {
    message: DiscordWebhookMessage;

    constructor() {
        this.message = {};
    }

    // Setters for each field in the message
    setContent(content: string | Text | unknown) {
        this.message.content = new Text(content).toString();
        return this;
    }

    setUsername(username: string) {
        this.message.username = username;
        return this;
    }

    setAvatarURL(avatarURL: string) {
        // todo: add fallback?
        this.message.avatar_url = validateUrl(avatarURL);
        return this;
    }

    setTTS(tts: boolean) {
        this.message.tts = tts;
        return this;
    }

    setEmbeds(embeds: Embed[]) {
        this.message.embeds = embeds;
        return this;
    }

    addEmbed(embed: Embed) {
        if (!this.message.embeds) {
            this.message.embeds = [];
        }

        this.message.embeds.push(embed);
        return this;
    }

    setAllowedMentions(allowedMentions: AllowedMention) {
        this.message.allowed_mentions = allowedMentions;
        return this;
    }

    setFlags(flags: number) {
        this.message.flags = flags;
        return this;
    }

    setThreadName(threadName: string) {
        this.message.thread_name = threadName;
        return this;
    }

    toJSON() {
        return this.message;
    }

    isEmpty() {
        return !this.message.content && !this.message.embeds;
    }
}
