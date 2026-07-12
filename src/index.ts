/**
 * Discord Bot Entry Point
 * 
 * Initializes and runs the Discord bot with:
 * - Slash command handling
 * - Admin-only button interactions for submission approval/rejection
 * - Persistent database for player submissions
 * 
 * Environment Variables:
 * - `DISCORD_TOKEN`: Bot token from Discord Developer Portal
 * 
 * @module bot
 */

import {
  Client,
  GatewayIntentBits,
  Collection,
  PermissionFlagsBits,
  EmbedBuilder,
} from 'discord.js';
import { loadDB, saveDB } from './db.js';
import { loadCommands } from './load-commands.js';
import type { Command } from './types.js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Initialize Discord client with necessary intents.
 * 
 * Intents enabled:
 * - `Guilds`: Required to access guild/channel/member data
 * - `GuildMessages`: Required to track messages in guilds
 */
const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

/**
 * Load all slash commands from the commands directory.
 * 
 * This populates the `commands` collection which is used to handle
 * incoming slash command interactions.
 */
const commands: Collection<string, Command> = await loadCommands();

/**
 * Fires when the bot successfully connects to Discord.
 */
client.once('clientReady', () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
});

/**
 * Handles all incoming interactions (commands and buttons).
 * 
 * Interactions are Discord events triggered by:
 * - Slash commands (ChatInputCommandInteraction)
 * - Button clicks (ButtonInteraction)
 */
client.on('interactionCreate', async (interaction) => {
  // ============================================================================
  // BUTTON INTERACTION HANDLER
  // ============================================================================
  if (interaction.isButton()) {
    const db = loadDB();
    const member = await interaction.guild?.members.fetch(interaction.user.id);

    /**
     * Check if user is admin.
     * 
     * User is considered admin if:
     * 1. They have the Administrator permission, OR
     * 2. They have the configured admin role
     */
    const isAdmin =
      member?.permissions.has(PermissionFlagsBits.Administrator) ||
      (db.config.adminRole && member?.roles.cache.has(db.config.adminRole));

    if (!isAdmin) {
      return interaction.reply({
        content: '🔒 Admins only.',
        ephemeral: true,
      });
    }

    /**
     * Parse button customId format: `action__discordId`
     * 
     * Examples:
     * - `approve__123456789`
     * - `reject__123456789`
     */
    const [action, discordId] = interaction.customId.split('__');

    if (!discordId) {
      return interaction.reply({
        content: '⚠️ Invalid interaction.',
        ephemeral: true,
      });
    }

    /**
     * Fetch the player submission from database.
     * 
     * Player object contains:
     * - status: 'pending' | 'approved' | 'rejected'
     * - reviewedBy: Admin username who reviewed it
     * - reviewedAt: Timestamp of review
     * - ... other submission data
     */
    const player = db.players[discordId]!;

    if (!player) {
      return interaction.reply({
        content: '⚠️ Submission not found.',
        ephemeral: true,
      });
    }

    // ========================================================================
    // APPROVE ACTION
    // ========================================================================
    if (action === 'approve') {
      // Update player record
      player.status = 'approved';
      player.reviewedBy = interaction.user.username;
      player.reviewedAt = Date.now();
      saveDB(db);

      // Update the approval message embed
      const updated = EmbedBuilder.from(interaction.message.embeds[0]!)
        .setColor(0x2ecc71) // Green
        .setFooter({ text: `✅ Approved by ${interaction.user.username}` });

      return interaction.update({
        embeds: [updated],
        components: [], // Remove approval/rejection buttons
      });
    }

    // ========================================================================
    // REJECT ACTION
    // ========================================================================
    if (action === 'reject') {
      // Update player record
      player.status = 'rejected';
      player.reviewedBy = interaction.user.username;
      player.reviewedAt = Date.now();
      saveDB(db);

      // Update the rejection message embed
      const updated = EmbedBuilder.from(interaction.message.embeds[0]!)
        .setColor(0xe74c3c) // Red
        .setFooter({ text: `❌ Rejected by ${interaction.user.username}` });

      return interaction.update({
        embeds: [updated],
        components: [], // Remove approval/rejection buttons
      });
    }
  }

  // ============================================================================
  // SLASH COMMAND HANDLER
  // ============================================================================
  if (!interaction.isChatInputCommand()) return;

  /**
   * Look up the command handler by command name.
   * 
   * Commands are loaded from the commands directory at startup
   * and indexed by their command name (e.g., 'generate', 'submit', etc.)
   */
  const command = commands.get(interaction.commandName);

  if (!command) return;

  try {
    /**
     * Execute the command's handler function.
     * 
     * Each command file exports an `execute` function that receives
     * the ChatInputCommandInteraction and handles the command logic.
     */
    await command.execute(interaction);
  } catch (err) {
    // Log the error for debugging
    console.error('Command execution error:', err);

    // Reply to user with error message
    await interaction.reply({
      content: '❌ Something went wrong.',
      ephemeral: true,
    });
  }
});

/**
 * Connect to Discord using the bot token.
 * 
 * The token is loaded from the `DISCORD_TOKEN` environment variable
 * defined in the `.env` file.
 * 
 * @throws Error if DISCORD_TOKEN is not defined
 */
client.login(process.env.DISCORD_TOKEN);
