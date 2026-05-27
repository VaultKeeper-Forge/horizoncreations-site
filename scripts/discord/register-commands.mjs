import { REST, Routes } from "discord.js";

import { commands } from "./commands.mjs";
import { requireEnv } from "./env.mjs";

const token = requireEnv("DISCORD_BOT_TOKEN");
const clientId = requireEnv("DISCORD_CLIENT_ID");
const guildId = process.env.DISCORD_GUILD_ID;
const rest = new REST({ version: "10" }).setToken(token);

if (guildId) {
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
  console.log(`Registered ${commands.length} command group(s) for guild ${guildId}.`);
} else {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log(`Registered ${commands.length} global command group(s).`);
}
