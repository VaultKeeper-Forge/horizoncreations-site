import { ChannelType, Client, GatewayIntentBits } from "discord.js";

import { requireEnv } from "./env.mjs";
import { shopConfig } from "./shop-config.mjs";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", async () => {
  try {
    const guild = await client.guilds.fetch(requireEnv("DISCORD_GUILD_ID"));
    const channels = await guild.channels.fetch();
    const channelByName = (name) =>
      [...channels.values()].find((channel) => channel?.type === ChannelType.GuildText && channel.name === name);
    const welcome = channelByName("welcome");
    const rules = channelByName("rules-and-info");
    const announcements = channelByName("announcements");
    const general = channelByName("general-off-topic");
    const showcase = channelByName("showcase");
    const orders = channelByName("custom-orders");

    await guild.edit(
      {
        name: shopConfig.serverName,
        description: shopConfig.description,
        rulesChannel: rules?.id,
        publicUpdatesChannel: announcements?.id,
        preferredLocale: "en-US",
      },
      "Codex cleanup for Horizon Creations public shop server identity",
    );

    if (welcome && general && showcase && orders) {
      try {
        await guild.editWelcomeScreen({
          enabled: true,
          description: shopConfig.description,
          welcomeChannels: [
            {
              channel: welcome.id,
              description: "Start here, read the rules, and pick your shop roles.",
              emoji: "👋",
            },
            {
              channel: general.id,
              description: "General craft talk and shop conversation.",
              emoji: "🛠️",
            },
            {
              channel: showcase.id,
              description: "Finished work and progress shots from any craft.",
              emoji: "✨",
            },
            {
              channel: orders.id,
              description: "Ask about custom work, orders, and rough project ideas.",
              emoji: "📐",
            },
          ],
        });
        console.log("Updated welcome screen.");
      } catch (error) {
        console.warn(`Could not update welcome screen: ${error.message}`);
      }
    }

    console.log(`Updated guild profile to ${shopConfig.serverName}.`);
  } finally {
    client.destroy();
  }
});

client.login(requireEnv("DISCORD_BOT_TOKEN"));
