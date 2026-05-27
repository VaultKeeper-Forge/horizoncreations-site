import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
} from "discord.js";
import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

import { requireEnv } from "./env.mjs";
import { shopConfig } from "./shop-config.mjs";

const clientIntents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages];
const pendingOpsActions = new Map();

if (process.env.DISCORD_ENABLE_MESSAGE_CONTENT === "true") {
  clientIntents.push(GatewayIntentBits.MessageContent);
}

const client = new Client({ intents: clientIntents });

client.once("clientReady", () => {
  console.log(`${shopConfig.botName} is online as ${client.user.tag}.`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton() && interaction.customId.startsWith("ops:")) {
    await handleOpsButton(interaction);
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("shop-role:")) {
    await toggleSelfAssignableRole(interaction);
    return;
  }

  if (!interaction.isChatInputCommand() || interaction.commandName !== "shop") {
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  try {
    if (subcommand === "links") {
      await interaction.reply({ embeds: [linksEmbed()] });
      return;
    }

    if (subcommand === "commission") {
      await interaction.reply({ embeds: [commissionEmbed()] });
      return;
    }

    if (subcommand === "server-map") {
      await interaction.reply({ embeds: [serverMapEmbed()] });
      return;
    }

    if (subcommand === "ticket") {
      await createTicket(interaction);
      return;
    }

    if (subcommand === "whats-printing") {
      await postMachineSnapshot(interaction);
      return;
    }

    if (subcommand === "announce") {
      await postAnnouncement(interaction);
      return;
    }

    if (subcommand === "setup") {
      await setupServer(interaction);
    }
  } catch (error) {
    console.error(error);

    const message = "Rivet hit a snag while handling that command. Check the bot logs for details.";

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) {
    return;
  }

  try {
    if (message.channel?.name === "codex-ops") {
      await handleOpsMessage(message);
      return;
    }

    if (message.mentions.has(client.user)) {
      await message.reply(
        "I hear you. For shop-control work, talk to me in #codex-ops. I can also run `/shop links`, `/shop commission`, `/shop server-map`, or `/shop whats-printing`.",
      );
    }
  } catch (error) {
    console.error(error);
    await message.reply("Rivet hit a snag while handling that. Check the bot logs for details.");
  }
});

function linksEmbed() {
  const fields = [
    { name: "Website", value: shopConfig.links.website },
    { name: "Facebook", value: shopConfig.links.facebook },
    { name: "Instagram", value: shopConfig.links.instagram },
  ];

  return new EmbedBuilder()
    .setTitle(`${shopConfig.serverName} links`)
    .setDescription(shopConfig.description)
    .addFields(fields)
    .setColor(0xd98b3a);
}

function commissionEmbed() {
  return new EmbedBuilder()
    .setTitle("Starting a custom order")
    .setDescription(
      "Send the idea, what it needs to fit or do, rough dimensions, references if you have them, and any deadline that matters.",
    )
    .addFields(
      { name: "Leather work", value: "Wallets, journal covers, pouches, straps, panels, tooling, dyes, and one-off pieces." },
      { name: "Shop work", value: "Forms, fixtures, 3D printed helpers, bench experiments, and practical build support." },
      { name: "Private help", value: "Use `/shop ticket` if the request needs measurements, pricing, or back-and-forth planning." },
    )
    .setColor(0xd98b3a);
}

function serverMapEmbed() {
  const fields = shopConfig.channelPlan.map((group) => ({
    name: group.category,
    value: group.channels.map((channel) => `#${channel.name}`).join(", "),
  }));

  return new EmbedBuilder()
    .setTitle(`${shopConfig.serverName} server map`)
    .setDescription("A practical layout for the shop, socials, orders, AI work, and backstage planning.")
    .addFields(fields)
    .setColor(0xd98b3a);
}

async function toggleSelfAssignableRole(interaction) {
  const roleName = interaction.customId.slice("shop-role:".length);
  const allowedRole = shopConfig.selfAssignableRoles.find((role) => role.name === roleName);

  if (!allowedRole) {
    await interaction.reply({ content: "That role is not self-assignable.", ephemeral: true });
    return;
  }

  const role = interaction.guild.roles.cache.find((candidate) => candidate.name === roleName);

  if (!role) {
    await interaction.reply({ content: `I could not find the ${roleName} role yet.`, ephemeral: true });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const hasRole = member.roles.cache.has(role.id);

  if (hasRole) {
    await member.roles.remove(role, "Self-assignable role removed through Rivet");
    await interaction.reply({ content: `Removed ${role.name}.`, ephemeral: true });
    return;
  }

  await member.roles.add(role, "Self-assignable role added through Rivet");
  await interaction.reply({ content: `Added ${role.name}.`, ephemeral: true });
}

async function createTicket(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const topic = interaction.options.getString("topic") || "New shop request";
  const safeName = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 24);
  const category = await findOrCreateCategory(guild, "The Shop Tickets");
  const channelName = `ticket-${safeName || interaction.user.id}`;

  const existing = guild.channels.cache.find(
    (channel) =>
      channel.parentId === category.id &&
      channel.name === channelName &&
      channel.type === ChannelType.GuildText,
  );

  if (existing) {
    await interaction.editReply(`You already have a ticket open: ${existing}`);
    return;
  }

  const supportRoleName = process.env.DISCORD_SUPPORT_ROLE_NAME || "Shop Crew";
  const supportRole = guild.roles.cache.find((role) => role.name === supportRoleName);
  const permissionOverwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  if (supportRole) {
    permissionOverwrites.push({
      id: supportRole.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic,
    permissionOverwrites,
  });

  await channel.send({
    content: `${interaction.user}, welcome to your shop ticket.`,
    embeds: [commissionEmbed().setTitle("Tell me what you want to build")],
  });

  await interaction.editReply(`Ticket created: ${channel}`);
}

async function postAnnouncement(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ content: "Only server managers can post announcements.", ephemeral: true });
    return;
  }

  const channelId = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;

  if (!channelId) {
    await interaction.reply({
      content: "Set DISCORD_ANNOUNCEMENT_CHANNEL_ID in `.env.local` first.",
      ephemeral: true,
    });
    return;
  }

  const message = interaction.options.getString("message", true);
  const imageUrl = interaction.options.getString("image_url");
  const channel = await interaction.guild.channels.fetch(channelId);

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({ content: "The configured announcement channel was not found.", ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Shop update")
    .setDescription(message)
    .setColor(0xd98b3a)
    .setTimestamp();

  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  await channel.send({ embeds: [embed] });
  await interaction.reply({ content: `Announcement posted in ${channel}.`, ephemeral: true });
}

async function postMachineSnapshot(interaction) {
  if (!canUseCamera(interaction)) {
    await interaction.reply({
      content: "Only server managers or Shop Crew can pull the machine-view camera.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const snapshotPath = await captureMachineSnapshot();
  const fileName = path.basename(snapshotPath);
  const attachment = new AttachmentBuilder(snapshotPath, { name: fileName });
  const embed = new EmbedBuilder()
    .setTitle("What's printing?")
    .setDescription("Fresh machine-view snapshot from the shop camera.")
    .setImage(`attachment://${fileName}`)
    .setColor(0xd98b3a)
    .setTimestamp();

  try {
    await interaction.editReply({ embeds: [embed], files: [attachment] });
  } finally {
    await rm(snapshotPath, { force: true });
  }
}

async function sendMachineSnapshot(channel) {
  const snapshotPath = await captureMachineSnapshot();
  const fileName = path.basename(snapshotPath);
  const attachment = new AttachmentBuilder(snapshotPath, { name: fileName });
  const embed = new EmbedBuilder()
    .setTitle("What's printing?")
    .setDescription("Fresh machine-view snapshot from the shop camera.")
    .setImage(`attachment://${fileName}`)
    .setColor(0xd98b3a)
    .setTimestamp();

  try {
    await channel.send({ embeds: [embed], files: [attachment] });
  } finally {
    await rm(snapshotPath, { force: true });
  }
}

async function handleOpsMessage(message) {
  const ownerUserId = process.env.DISCORD_OWNER_USER_ID;

  if (!ownerUserId || message.author.id !== ownerUserId) {
    await message.reply("This ops lane only accepts requests from VaultKeeper.");
    return;
  }

  const content = normalizeOpsContent(message.content || "");

  if (!content) {
    await message.reply(
      "I can see you, but Discord is not giving me plain message text yet. For now, mention me in the message, or enable Message Content Intent and set `DISCORD_ENABLE_MESSAGE_CONTENT=true`.",
    );
    return;
  }

  if (/\b(help|what can you do|commands)\b/i.test(content)) {
    await message.reply({ embeds: [opsHelpEmbed()] });
    return;
  }

  if (/\b(what'?s printing|camera|machine view|snapshot|printer)\b/i.test(content)) {
    await message.reply("Pulling a fresh machine-view shot.");
    await sendMachineSnapshot(message.channel);
    return;
  }

  if (/\b(git status|changed files|repo status)\b/i.test(content)) {
    await message.reply(await runOpsCommand("git", ["status", "--short"]));
    return;
  }

  if (/\b(diff|what changed|changes|patch)\b/i.test(content)) {
    await message.reply(await runOpsCommand("git", ["diff", "--stat"]));
    return;
  }

  if (/\b(log|recent commits|commit history)\b/i.test(content)) {
    await message.reply(await runOpsCommand("git", ["log", "--oneline", "-8"]));
    return;
  }

  if (/\b(build|rebuild)\b/i.test(content) && /\b(site|website|web)\b/i.test(content)) {
    await message.reply("Running the website build now.");
    await message.reply(await runOpsCommand(npmCommand(), ["run", "build"], 120000));
    return;
  }

  if (/\b(refresh|reapply|setup|sync)\b/i.test(content) && /\b(discord|channels|server)\b/i.test(content)) {
    await message.reply("Refreshing the Discord channel layout now.");
    await message.reply(await runOpsCommand(npmCommand(), ["run", "discord:setup-channels"], 120000));
    return;
  }

  if (/\b(rules|role picker|roles panel|self roles)\b/i.test(content) && /\b(post|repost|refresh|sync|update)\b/i.test(content)) {
    await message.reply("Refreshing the rules and role picker panel now.");
    await message.reply(await runOpsCommand(npmCommand(), ["run", "discord:post-rules"], 120000));
    return;
  }

  if (/\b(clean|wipe|clear|reset|fresh)\b/i.test(content) && /\b(general|general-off-topic)\b/i.test(content)) {
    await requestOpsConfirmation(message, {
      action: "recreate-general",
      title: "Recreate #general-off-topic?",
      description:
        "This deletes the current #general-off-topic channel and creates a fresh one with the standard topic. Channel history will be gone.",
    });
    return;
  }

  if (/\b(restart|reboot)\b/i.test(content) && /\b(rivet|bot|yourself)\b/i.test(content)) {
    await message.reply(
      "I can prepare for restart, but I should not kill my own process from Discord until we put Rivet under a real supervisor on the Pi or Windows Task Scheduler. For now, restart me from this PC with `npm.cmd run discord:bot`.",
    );
    return;
  }

  if (/\b(status|are you alive|you there|health)\b/i.test(content)) {
    await message.reply({ embeds: [await opsStatusEmbed()] });
    return;
  }

  await message.reply(
    [
      "I hear you. I do not have the full Codex brain wired into Discord yet, but this ops lane is live.",
      "Try `help`, `status`, `git status`, `what changed`, `build website`, `refresh Discord channels`, `refresh rules`, `wipe general`, or `what's printing`.",
    ].join("\n"),
  );
}

async function handleOpsButton(interaction) {
  const ownerUserId = process.env.DISCORD_OWNER_USER_ID;

  if (!ownerUserId || interaction.user.id !== ownerUserId) {
    await interaction.reply({ content: "Only VaultKeeper can confirm ops actions.", ephemeral: true });
    return;
  }

  const [, decision, actionId] = interaction.customId.split(":");
  const pending = pendingOpsActions.get(actionId);

  if (!pending) {
    await interaction.reply({ content: "That action expired or was already handled.", ephemeral: true });
    return;
  }

  pendingOpsActions.delete(actionId);

  if (decision === "cancel") {
    await interaction.update({ content: "Cancelled.", embeds: [], components: [] });
    return;
  }

  await interaction.update({ content: `Confirmed: ${pending.title}`, embeds: [], components: [] });

  if (pending.action === "recreate-general") {
    await interaction.followUp(await recreateGeneralChannel(interaction.guild));
    return;
  }

  await interaction.followUp("I do not know how to run that confirmed action yet.");
}

async function requestOpsConfirmation(message, pending) {
  const actionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  pendingOpsActions.set(actionId, pending);
  setTimeout(() => pendingOpsActions.delete(actionId), 10 * 60 * 1000);

  const embed = new EmbedBuilder()
    .setTitle(pending.title)
    .setDescription(pending.description)
    .setColor(0xe0a340);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ops:confirm:${actionId}`)
      .setLabel("Confirm")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ops:cancel:${actionId}`)
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary),
  );

  await message.reply({ embeds: [embed], components: [row] });
}

function opsHelpEmbed() {
  return new EmbedBuilder()
    .setTitle("Codex Ops Help")
    .setDescription(
      [
        "Talk naturally in this channel. I will map plain requests to approved shop operations.",
        "",
        "**PC and repo**",
        "`status` - richer Rivet, repo, and environment status",
        "`git status` - changed files",
        "`what changed` - diff summary",
        "`recent commits` - last few commits",
        "`build website` - run the static site build",
        "",
        "**Discord shop**",
        "`refresh Discord channels` - reapply the starter channel layout",
        "`refresh rules` - repost the rules and role picker panel",
        "`wipe general` - asks for confirmation, then recreates #general-off-topic",
        "",
        "**Shop camera**",
        "`what's printing` - post a fresh USB machine-view snapshot",
        "",
        "I still do not run arbitrary shell commands from Discord. We can add approved operations as we need them.",
      ].join("\n"),
    )
    .setColor(0xd98b3a);
}

async function opsStatusEmbed() {
  const gitStatus = await commandText("git", ["status", "--short"]);
  const lastCommit = await commandText("git", ["log", "-1", "--oneline"]);

  return new EmbedBuilder()
    .setTitle("Rivet Ops Status")
    .setDescription("I am online on this PC and listening in #codex-ops.")
    .addFields(
      { name: "Repo", value: codeInline(process.cwd()) },
      { name: "Node", value: codeInline(process.version), inline: true },
      { name: "Message Content", value: codeInline(process.env.DISCORD_ENABLE_MESSAGE_CONTENT === "true" ? "enabled" : "mention-only"), inline: true },
      { name: "Last Commit", value: codeBlock(truncateOutput(lastCommit || "No commit found.")) },
      { name: "Git Status", value: codeBlock(truncateOutput(gitStatus || "Clean working tree.")) },
    )
    .setColor(0x2f80ed)
    .setTimestamp();
}

async function commandText(command, args, timeoutMs = 30000) {
  try {
    const { stdout, stderr } = await runProcess(command, args, timeoutMs);
    return [stdout, stderr].filter(Boolean).join("\n").trim();
  } catch (error) {
    return error.message;
  }
}

async function recreateGeneralChannel(guild) {
  const channels = await guild.channels.fetch();
  const shopFloor = [...channels.values()].find(
    (channel) => channel?.type === ChannelType.GuildCategory && channel.name === "Shop Floor",
  );

  if (!shopFloor) {
    return "I could not find the Shop Floor category.";
  }

  const existing = [...channels.values()].find(
    (channel) => channel?.type === ChannelType.GuildText && channel.name === "general-off-topic",
  );
  let position = 0;

  if (existing) {
    position = existing.rawPosition;
    await existing.delete("VaultKeeper confirmed fresh general-off-topic reset");
  }

  const fresh = await guild.channels.create({
    name: "general-off-topic",
    type: ChannelType.GuildText,
    parent: shopFloor.id,
    topic: "General chat for the crew, customers, and friends of The Shop.",
    reason: "VaultKeeper confirmed fresh general-off-topic reset",
  });

  if (position) {
    await fresh.setPosition(position, { reason: "Restore general-off-topic placement" });
  }

  await fresh.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("General Chat Is Fresh")
        .setDescription(
          "This channel is for everyday shop talk, quick questions, casual conversation, and anything that does not fit neatly into leather, printing, showcase, or orders.",
        )
        .setColor(0xd98b3a),
    ],
  });

  return `Recreated ${fresh}.`;
}

function normalizeOpsContent(content) {
  return content
    .replaceAll(new RegExp(`<@!?${client.user?.id}>`, "g"), "")
    .trim();
}

async function runOpsCommand(command, args, timeoutMs = 30000) {
  try {
    const { stdout, stderr } = await runProcess(command, args, timeoutMs);
    const output = [stdout, stderr].filter(Boolean).join("\n").trim() || "Done. No output.";
    return codeBlock(truncateOutput(output));
  } catch (error) {
    return codeBlock(truncateOutput(error.message));
  }
}

function runProcess(command, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);

      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} exited with ${code}\n${stderr || stdout}`));
    });
  });
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function codeBlock(value) {
  return `\`\`\`\n${value}\n\`\`\``;
}

function codeInline(value) {
  return `\`${String(value).replaceAll("`", "'")}\``;
}

function truncateOutput(value) {
  const maxLength = 1800;

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n...output truncated...`;
}

function canUseCamera(interaction) {
  if (interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return true;
  }

  const supportRoleName = process.env.DISCORD_SUPPORT_ROLE_NAME || "Shop Crew";
  const roles = interaction.member?.roles;

  if (!roles?.cache) {
    return false;
  }

  return roles.cache.some((role) => role.name === supportRoleName);
}

async function captureMachineSnapshot() {
  const cameraName = process.env.SHOP_MACHINE_CAMERA_NAME || "Logi C615 HD WebCam";
  const videoSize = process.env.SHOP_MACHINE_CAMERA_SIZE || "1280x720";
  const tmpDir = path.join(process.cwd(), "tmp");
  const snapshotPath = path.join(tmpDir, `machine-${Date.now()}.jpg`);

  await mkdir(tmpDir, { recursive: true });
  await runFfmpeg([
    "-hide_banner",
    "-y",
    "-f",
    "dshow",
    "-video_size",
    videoSize,
    "-i",
    `video=${cameraName}`,
    "-frames:v",
    "1",
    "-update",
    "1",
    "-q:v",
    "2",
    snapshotPath,
  ]);

  return snapshotPath;
}

async function runFfmpeg(args) {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

  await new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`ffmpeg exited with ${code}: ${stderr}`));
    });
  });
}

async function setupServer(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ content: "Only server managers can run setup.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const created = [];

  for (const roleConfig of shopConfig.roles) {
    const roleName = typeof roleConfig === "string" ? roleConfig : roleConfig.name;
    const existingRole = guild.roles.cache.find((role) => role.name === roleName);

    if (!existingRole) {
      await guild.roles.create({
        name: roleName,
        colors: roleConfig.color ? { primaryColor: roleConfig.color } : undefined,
        hoist: Boolean(roleConfig.hoist),
        mentionable: Boolean(roleConfig.mentionable),
        reason: "The Shop setup command",
      });
      created.push(`role: ${roleName}`);
    }
  }

  for (const group of shopConfig.channelPlan) {
    const category = await findOrCreateCategory(guild, group.category);

    if (category.createdDuringSetup) {
      created.push(`category: ${group.category}`);
    }

    for (const channel of group.channels) {
      const existingChannel = guild.channels.cache.find(
        (candidate) =>
          candidate.parentId === category.id &&
          candidate.name === channel.name &&
          candidate.type === ChannelType.GuildText,
      );

      if (!existingChannel) {
        await guild.channels.create({
          name: channel.name,
          type: ChannelType.GuildText,
          parent: category.id,
          topic: channel.topic,
          permissionOverwrites: group.private
            ? [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }]
            : undefined,
          reason: "The Shop setup command",
        });
        created.push(`channel: #${channel.name}`);
      }
    }
  }

  await interaction.editReply(
    created.length
      ? `Setup finished. Created ${created.length} item(s): ${created.join(", ")}.`
      : "Setup finished. Everything in the basic plan already exists.",
  );
}

async function findOrCreateCategory(guild, name) {
  const existing = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name === name,
  );

  if (existing) {
    existing.createdDuringSetup = false;
    return existing;
  }

  const category = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    reason: "The Shop setup command",
  });
  category.createdDuringSetup = true;
  return category;
}

client.login(requireEnv("DISCORD_BOT_TOKEN"));
