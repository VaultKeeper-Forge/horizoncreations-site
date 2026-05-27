import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Open The Shop assistant.")
    .addSubcommand((subcommand) =>
      subcommand.setName("links").setDescription("Show the website and social links."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("commission")
        .setDescription("Show what to send when starting a custom order."),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("server-map").setDescription("Show the planned server layout."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ticket")
        .setDescription("Create a private custom order or support ticket.")
        .addStringOption((option) =>
          option
            .setName("topic")
            .setDescription("Short note about what you need.")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("whats-printing")
        .setDescription("Pull a fresh machine-view snapshot from the shop camera."),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("announce")
        .setDescription("Post a shop announcement to the configured announcements channel.")
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Announcement text.")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("image_url")
            .setDescription("Optional image URL to include.")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setDescription("Create the basic roles and channels for The Shop."),
    ),
].map((command) => command.toJSON());
