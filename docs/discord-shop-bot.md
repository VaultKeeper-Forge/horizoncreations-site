# Rivet Discord Bot

Rivet connects the Horizon Creations website, socials, custom-order flow, and Discord server.

## What It Does

- `/shop links` posts the website, Facebook, Instagram, and optional invite link.
- `/shop commission` explains what a customer should send for a custom request.
- `/shop server-map` shows the planned server layout.
- `/shop ticket` creates a private support/custom-order channel for the requester.
- `/shop whats-printing` posts a fresh machine-view snapshot from the configured shop camera.
- `/shop announce` posts an embed into the configured announcements channel.
- `/shop setup` creates the baseline The Shop roles, categories, and channels without deleting anything.

## Setup

1. Create an application in the Discord Developer Portal.
2. Add a bot user and copy the bot token.
3. Enable the bot permissions your server needs: `applications.commands`, `bot`, `Manage Channels`, `Manage Roles`, `Send Messages`, `Embed Links`, `Read Message History`, and `View Channels`.
4. Invite the bot to your server.
5. Copy `.env.example` to `.env.local` and fill in the Discord values.
6. Register slash commands:

```powershell
npm run discord:commands
```

7. Start the bot:

```powershell
npm run discord:bot
```

For faster command updates while building, set `DISCORD_GUILD_ID`. Guild commands update immediately. Global commands can take longer to appear.

## Machine Camera

On Windows, Rivet uses FFmpeg DirectShow to capture the machine-view camera.

```env
SHOP_MACHINE_CAMERA_NAME=Logi C615 HD WebCam
SHOP_MACHINE_CAMERA_SIZE=1280x720
FFMPEG_PATH=ffmpeg
```

List camera device names with:

```powershell
ffmpeg -hide_banner -list_devices true -f dshow -i dummy
```

## Website Link

Set `SITE_DISCORD_URL` before running `npm run build` if you want the generated website to show a Discord card next to Facebook and Instagram.

```powershell
$env:SITE_DISCORD_URL="https://discord.gg/your-invite"
npm run build
```

## Recommended Server Shape

- Welcome: `#welcome`, `#announcements`, `#rules-and-info`
- Shop Floor: `#general-off-topic`, `#leather-art`, `#forge-mesh`, `#ai-chat`, `#showcase`
- Orders And Support: `#custom-orders`, `#support`
- Backstage: `#back-stage`, `#plod-research-channel`

The setup command only creates missing items. It does not rename or delete existing channels.
