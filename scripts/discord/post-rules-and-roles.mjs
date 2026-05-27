import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
} from "discord.js";

import { requireEnv } from "./env.mjs";
import { shopConfig } from "./shop-config.mjs";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once("clientReady", async () => {
  try {
    const guild = await client.guilds.fetch(requireEnv("DISCORD_GUILD_ID"));
    const channels = await guild.channels.fetch();
    const rulesChannel = [...channels.values()].find(
      (channel) => channel?.type === ChannelType.GuildText && channel.name === "rules-and-info",
    );

    if (!rulesChannel) {
      throw new Error("Could not find #rules-and-info.");
    }

    await removeOldBotPanels(rulesChannel);
    await rulesChannel.send({ embeds: [rulesEmbed()] });
    await rulesChannel.send({ embeds: [rolesEmbed()], components: roleRows() });

    console.log(`Posted rules and role picker in #${rulesChannel.name}.`);
  } finally {
    client.destroy();
  }
});

function rulesEmbed() {
  return new EmbedBuilder()
    .setTitle("Horizon Creations Shop Rules")
    .setDescription(shopConfig.rules.map((rule, index) => `${index + 1}. ${rule}`).join("\n\n"))
    .setColor(0xd98b3a);
}

function rolesEmbed() {
  return new EmbedBuilder()
    .setTitle("Pick Your Shop Roles")
    .setDescription(
      [
        "Use the buttons below to add or remove public interest and notification roles.",
        "",
        ...shopConfig.selfAssignableRoles.map(
          (role) => `**${role.label}** - ${role.description}`,
        ),
      ].join("\n"),
    )
    .setColor(0x2f80ed);
}

function roleRows() {
  const buttons = shopConfig.selfAssignableRoles.map((role) =>
    applyOptionalEmoji(new ButtonBuilder()
      .setCustomId(`shop-role:${role.name}`)
      .setLabel(role.label)
      .setStyle(ButtonStyle.Secondary), role.emoji),
  );

  const rows = [];

  for (let index = 0; index < buttons.length; index += 4) {
    rows.push(new ActionRowBuilder().addComponents(buttons.slice(index, index + 4)));
  }

  return rows;
}

async function removeOldBotPanels(channel) {
  const messages = await channel.messages.fetch({ limit: 25 });
  const oldPanels = messages.filter(
    (message) =>
      message.author.id === client.user.id &&
      message.embeds.some((embed) =>
        ["The Shop Rules", "Horizon Creations Shop Rules", "Pick Your Shop Roles"].includes(embed.title),
      ),
  );

  for (const message of oldPanels.values()) {
    await message.delete();
  }
}

function applyOptionalEmoji(button, emoji) {
  return emoji ? button.setEmoji(emoji) : button;
}

client.login(requireEnv("DISCORD_BOT_TOKEN"));
