import {
  ChannelType,
  Client,
  GatewayIntentBits,
  OverwriteType,
  PermissionFlagsBits,
} from "discord.js";

import { requireEnv } from "./env.mjs";
import { shopConfig } from "./shop-config.mjs";

const channelAliases = new Map([
  ["forge-mesh", ["forge_mesh"]],
  ["plod-research-channel", ["plod_research_channel"]],
]);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("clientReady", async () => {
  try {
    const guild = await client.guilds.fetch(requireEnv("DISCORD_GUILD_ID"));
    const result = await applyChannelPlan(guild);

    console.log(`Created: ${result.created.length ? result.created.join(", ") : "none"}`);
    console.log(`Updated: ${result.updated.length ? result.updated.join(", ") : "none"}`);
    console.log(`Moved: ${result.moved.length ? result.moved.join(", ") : "none"}`);
  } finally {
    client.destroy();
  }
});

async function applyChannelPlan(guild) {
  const created = [];
  const updated = [];
  const moved = [];
  const channels = await guild.channels.fetch();
  const roles = await guild.roles.fetch();

  for (const rename of shopConfig.legacyRoleRenames || []) {
    const oldRole = roles.find((role) => role.name === rename.from);
    const newRole = roles.find((role) => role.name === rename.to);

    if (oldRole && !newRole) {
      await oldRole.edit({ name: rename.to }, "Codex cleanup of legacy AI server role names");
      updated.push(`role ${rename.from} -> ${rename.to}`);
    }
  }

  for (const group of shopConfig.channelPlan) {
    const category = await findOrCreateCategory(guild, channels, group.category, group.private, roles);

    if (!channels.has(category.id)) {
      channels.set(category.id, category);
      created.push(`category ${group.category}`);
    }

    for (const plannedChannel of group.channels) {
      const channel = await findOrCreateTextChannel(guild, channels, plannedChannel.name, category);

      if (!channels.has(channel.id)) {
        channels.set(channel.id, channel);
        created.push(`#${plannedChannel.name}`);
      }

      const changes = {};

      if (channel.name !== plannedChannel.name) {
        changes.name = plannedChannel.name;
      }

      if (channel.topic !== plannedChannel.topic) {
        changes.topic = plannedChannel.topic;
      }

      if (channel.parentId !== category.id) {
        changes.parent = category.id;
      }

      if (Object.keys(changes).length) {
        await channel.edit(changes, "Codex starter channel setup for The Shop");
        updated.push(`#${plannedChannel.name}`);
      }

      if (plannedChannel.ownerOnly) {
        await channel.permissionOverwrites.set(
          ownerOnlyPermissionOverwrites(guild, roles),
          "Codex owner-only operations channel setup",
        );
        updated.push(`#${plannedChannel.name} permissions`);
      }

      if (channel.parentId !== category.id) {
        moved.push(`#${plannedChannel.name}`);
      }
    }
  }

  return { created, updated, moved };
}

async function findOrCreateCategory(guild, channels, name, isPrivate, roles) {
  const existing = [...channels.values()].find(
    (channel) => channel?.type === ChannelType.GuildCategory && channel.name === name,
  );

  if (existing) {
    if (isPrivate) {
      await applyPrivateCategoryPermissions(existing, guild, roles);
    }

    return existing;
  }

  const category = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: isPrivate ? privatePermissionOverwrites(guild, roles) : undefined,
    reason: "Codex starter channel setup for The Shop",
  });

  return category;
}

async function findOrCreateTextChannel(guild, channels, name, category) {
  const existing = findTextChannel(channels, name);

  if (existing) {
    return existing;
  }

  return guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: category.id,
    reason: "Codex starter channel setup for The Shop",
  });
}

function findTextChannel(channels, name) {
  const names = new Set([name, ...(channelAliases.get(name) || [])]);

  return [...channels.values()].find(
    (channel) => channel?.type === ChannelType.GuildText && names.has(channel.name),
  );
}

async function applyPrivateCategoryPermissions(category, guild, roles) {
  await category.permissionOverwrites.set(
    privatePermissionOverwrites(guild, roles),
    "Codex private backstage setup for The Shop",
  );
}

function privatePermissionOverwrites(guild, roles) {
  const allowedRoleNames = new Set(["Forge", "Shop Crew"]);
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
      type: OverwriteType.Role,
    },
  ];

  for (const role of roles.values()) {
    if (allowedRoleNames.has(role.name)) {
      overwrites.push({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
        type: OverwriteType.Role,
      });
    }
  }

  return overwrites;
}

function ownerOnlyPermissionOverwrites(guild, roles) {
  const ownerUserId = process.env.DISCORD_OWNER_USER_ID;
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
      type: OverwriteType.Role,
    },
  ];

  for (const role of roles.values()) {
    if (["Forge", "Shop Crew"].includes(role.name)) {
      overwrites.push({
        id: role.id,
        deny: [PermissionFlagsBits.ViewChannel],
        type: OverwriteType.Role,
      });
    }
  }

  if (ownerUserId) {
    overwrites.push({
      id: ownerUserId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
      type: OverwriteType.Member,
    });
  }

  return overwrites;
}

client.login(requireEnv("DISCORD_BOT_TOKEN"));
