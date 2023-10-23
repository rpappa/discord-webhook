import { Text } from "./Text.js";
import { validateDateConstructorArg, validateUrl } from "./util/validation.js";

interface Media {
    url: string;
}

interface Footer {
    text: string;
    icon_url?: string;
    proxy_icon_url?: string;
}

interface Author {
    name: string;
    url?: string;
    icon_url?: string;
}

interface Field {
    name: string;
    value: string | Text;
    inline?: boolean;
}

interface DiscordEmbed {
    title?: string;
    description?: string | Text;
    url?: string;
    timestamp?: string;
    color?: number;
    footer?: Footer;
    image?: Media;
    thumbnail?: Media;
    author?: Author;
    fields?: Field[];
}

const COLOR_SUCCESS = 0x00ff00;
const COLOR_ERROR = 0xff0000;
const COLOR_WARNING = 0xffcc00;

export class Embed {
    private readonly embed: DiscordEmbed;
    private readonly fallbackImageUrl?: string;

    constructor(fallbackImageUrl?: string) {
        this.embed = {};
        this.fallbackImageUrl = fallbackImageUrl;
    }

    setTitle(title: unknown) {
        this.embed.title = new Text(title).toString();
        return this;
    }

    /**
     * Set the description of this embed. Objects will be converted to a string representation.
     */
    setDescription(description: unknown) {
        this.embed.description = new Text(description);
        return this;
    }

    setURL(url: string) {
        this.embed.url = validateUrl(url);
        return this;
    }

    setTimestamp(timestamp?: ConstructorParameters<typeof Date>[0]) {
        if (timestamp) {
            const validated = validateDateConstructorArg(timestamp);
            if (validated) {
                this.embed.timestamp = validated.toISOString();
            }
        }

        return this;
    }

    setColor(color: number) {
        if (typeof color === "number") {
            this.embed.color = color;
        }

        return this;
    }

    success() {
        return this.setColor(COLOR_SUCCESS);
    }

    error() {
        return this.setColor(COLOR_ERROR);
    }

    warning() {
        return this.setColor(COLOR_WARNING);
    }

    setFooter(text: string | Text, icon_url?: string) {
        // only set icon_url if it's provided as an argument
        const imageUrl = icon_url && this.getFallbackImageUrl(icon_url);
        if (text) {
            this.embed.footer = {
                text: new Text(text).toString(),
                icon_url: imageUrl,
            };
        }

        return this;
    }

    setImage(url: string) {
        const imageUrl = this.getFallbackImageUrl(url);
        if (imageUrl) {
            this.embed.image = {
                url: imageUrl,
            };
        }

        return this;
    }

    setThumbnail(url: string) {
        const imageUrl = this.getFallbackImageUrl(url);
        if (imageUrl) {
            this.embed.thumbnail = {
                url: imageUrl,
            };
        }

        return this;
    }

    setAuthor(name: string | Text, url?: string, icon_url?: string) {
        const imageUrl = icon_url && this.getFallbackImageUrl(icon_url);
        if (name) {
            this.embed.author = {
                name: new Text(name).toString(),
                url: validateUrl(url),
                icon_url: imageUrl,
            };
        }

        return this;
    }

    addField(name: string | Text, value: unknown, inline?: boolean) {
        if (!this.embed.fields) {
            this.embed.fields = [];
        }

        this.embed.fields.push({
            name: new Text(name).toString(),
            value: new Text(value).toString(),
            inline,
        });
        return this;
    }

    addFieldsObj(object: { [key: string]: unknown }) {
        for (const [key, value] of Object.entries(object)) {
            this.addField(new Text(key), new Text(value).forceMultiline(true));
        }

        return this;
    }

    toJSON() {
        return this.embed;
    }

    private getFallbackImageUrl(originalUrl?: string) {
        const url =
            validateUrl(originalUrl) ??
            validateUrl(this.fallbackImageUrl) ??
            validateUrl(process.env[`FALLBACK_IMAGE_URL`]);

        return url;
    }
}
