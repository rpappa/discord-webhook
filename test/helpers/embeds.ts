import { Embed, Text } from "../../src/index.js";

export function everythingEmbed() {
    const embed = new Embed();
    embed.setTitle(`Title`);
    embed.setDescription(`Description`);
    embed.setURL(`https://example.com`);
    embed.setTimestamp(new Date().toISOString());
    embed.setColor(0x00ffff);
    embed.setFooter(`Footer`, `https://picsum.photos/200`);
    embed.setImage(`https://picsum.photos/200`);
    embed.setThumbnail(`https://picsum.photos/200`);
    embed.setAuthor(`Author`, `https://example.com`, `https://picsum.photos/200`);

    embed.addField(`Field 1`, `Value 1`);
    embed.addField(`Field 2`, `Value 2`, true);
    embed.addField(`Field 3`, `Value 3`, true);

    return embed;
}

const defaultObject = {
    foo: `bar`,
};

const multiLineString = `foo\nbar`;

export function everythingMultiLineEmbed() {
    const embed = new Embed();
    embed.setTitle(`Title`);
    embed.setDescription(new Text(defaultObject));
    embed.setURL(multiLineString);
    embed.setTimestamp(multiLineString);
    embed.setColor(0x00ffff);
    embed.setFooter(new Text(defaultObject), multiLineString);
    embed.setImage(multiLineString);
    embed.setThumbnail(multiLineString);
    embed.setAuthor(new Text(defaultObject), multiLineString, multiLineString);

    embed.addField(new Text(defaultObject), new Text(defaultObject));
    embed.addField(new Text(defaultObject), new Text(defaultObject), true);
    embed.addField(new Text(defaultObject), new Text(defaultObject), true);

    return embed;
}
