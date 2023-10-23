import { Text } from "./Text.js";

/**
 * Helper function to create a Text instance
 */
export function text(from: unknown) {
    return new Text(from);
}

export * from "./Embed.js";
export * from "./Webhook.js";
export * from "./Message.js";

export * from "./Text.js";
