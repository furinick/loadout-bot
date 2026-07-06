/**
 * Submit Loadout Slash Command
 * 
 * Allows players to submit their ACE Arsenal loadout for admin approval.
 * Validates the loadout format, stores it in the database, and posts a review
 * embed to the designated loadout channel with approve/reject buttons.
 * 
 * Command: `/submit <name> <role> <squad> <loadout>`
 * 
 * @module submit-command
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js';
import { loadDB, saveDB, config } from '../db.js';
import type { Player } from '../types.js';
import { calculateWeight } from '../weight.js';
import { validateLoadoutString } from '../validation/loadout.js';

/**
 * Slash command definition.
 * 
 * Defines the command name, description, and required options:
 * - `name`: In-game player name
 * - `role`: Character role — autocompleted at startup from config
 * - `squad`: Squad assignment — autocompleted at startup from config
 * - `loadout`: Raw ACE Arsenal SQF export string
 */
export const data = new SlashCommandBuilder()
  .setName('submit')
  .setDescription('Submit your loadout for approval')
  .addStringOption(opt =>
    opt
      .setName('name')
      .setDescription('Your in-game name')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt
      .setName('role')
      .setDescription('Your role')
      .setRequired(true)
      .addChoices(...config.roles.map(r => ({ name: r, value: r })))
  )
  .addStringOption(opt =>
    opt
      .setName('squad')
      .setDescription('Your squad')
      .setRequired(true)
      .addChoices(...config.squads.map(s => ({ name: s, value: s })))
  )
  .addStringOption(opt =>
    opt
      .setName('loadout')
      .setDescription('Paste your ACE Arsenal SQF export here')
      .setRequired(true)
  );

/**
 * Handles autocomplete interactions for the submit command.
 * 
 * Responds with filtered role or squad options from the config,
 * matching what the user has typed so far.
 * 
 * @param interaction - The Discord autocomplete interaction
 */
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused(true);

  let choices: string[] = [];
  if (focused.name === 'role') choices = config.roles;
  if (focused.name === 'squad') choices = config.squads;

  const filtered = choices
    .filter(c => c.toLowerCase().startsWith(focused.value.toLowerCase()))
    .map(c => ({ name: c, value: c }));

  await interaction.respond(filtered);
}

/**
 * Executes the submit command.
 * 
 * Flow:
 * 1. Validate that submission is in the correct channel (if configured)
 * 2. Check for duplicate submissions from the same user
 * 3. Validate role and squad against config
 * 4. Validate the ACE Arsenal loadout format
 * 5. Create player record in database with pending status
 * 6. Calculate loadout weight
 * 7. Post review embed to loadout channel with approve/reject buttons
 * 8. Confirm submission to user (ephemeral)
 * 
 * @param interaction - The Discord interaction from the `/submit` command
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  const db = loadDB();

  // ============================================================================
  // CHANNEL VALIDATION
  // ============================================================================
  /**
   * Check if submission is in the correct channel.
   * 
   * If a loadoutChannel is configured in the bot settings, submissions
   * are only accepted in that channel to keep submissions organized.
   */
  if (db.config.loadoutChannel && interaction.channelId !== db.config.loadoutChannel) {
    return interaction.reply({
      content: `Please submit in <#${db.config.loadoutChannel}>.`,
      ephemeral: true,
    });
  }

  // ============================================================================
  // DUPLICATE CHECK
  // ============================================================================
  /**
   * Check if user already has a pending or approved submission.
   * 
   * Users must remove their previous submission before resubmitting.
   * This prevents duplicate entries in the database.
   */
  if (db.players[interaction.user.id]) {
    return interaction.reply({
      content: `You already have a submission. Use \`/remove\` first if you want to resubmit.`,
      ephemeral: true,
    });
  }

  // ============================================================================
  // ROLE AND SQUAD VALIDATION
  // ============================================================================
  /**
   * Validate role and squad against the config.
   * 
   * Users can bypass autocomplete and type anything, so we validate
   * the submitted values before accepting them.
   */
  const role = interaction.options.getString('role', true);
  const squad = interaction.options.getString('squad', true);

  if (!config.roles.includes(role)) {
    return interaction.reply({
      content: `❌ Invalid role **${role}**.\nValid roles: ${config.roles.join(', ')}`,
      ephemeral: true,
    });
  }

  if (!config.squads.includes(squad)) {
    return interaction.reply({
      content: `❌ Invalid squad **${squad}**.\nValid squads: ${config.squads.join(', ')}`,
      ephemeral: true,
    });
  }

  // ============================================================================
  // LOADOUT VALIDATION
  // ============================================================================
  /**
   * Get the loadout string from the command options.
   * 
   * This is the raw ACE Arsenal JSON export (typically pasted from SQF scripts).
   */
  const loadoutString: string = interaction.options.getString('loadout', true);

  /**
   * Validate the loadout format before storing.
   * 
   * This checks:
   * - Valid JSON structure
   * - Correct number of slots
   * - Proper types for each slot
   * - Valid weapon/container/item entries
   */
  const validationResult = validateLoadoutString(loadoutString);

  if (!validationResult.valid) {
    const errors: string[] = validationResult.errors
      .slice(0, 5)
      .map(e => `- ${e.message}`);

    return interaction.reply({
      content: `❌ Invalid loadout:\n${errors.join('\n')}`,
      ephemeral: true,
    });
  }

  // ============================================================================
  // CREATE PLAYER RECORD
  // ============================================================================
  /**
   * Construct the player record.
   * 
   * All fields are populated from command options and current state.
   * Status is set to 'pending' until an admin approves or rejects it.
   */
  const player: Player = {
    discordUID: interaction.user.id,
    name: interaction.options.getString('name', true),
    role,
    squad,
    loadout: loadoutString,
    status: 'pending',
    submittedAt: Date.now(),
  };

  /**
   * Calculate the total weight of the loadout.
   * 
   * Uses the item database to sum up weights of all items.
   * May return null if the item database isn't available.
   */
  const weight: number | null = calculateWeight(player.loadout);

  // Save to database
  db.players[interaction.user.id] = player;
  saveDB(db);

  // ============================================================================
  // POST REVIEW EMBED
  // ============================================================================
  /**
   * Fetch the loadout review channel.
   * 
   * If no loadout channel is configured, use the channel where the command
   * was executed as the default review location.
   */
  const loadoutChannelId: string = db.config.loadoutChannel ?? interaction.channelId;
  const loadoutChannel = await interaction.client.channels.fetch(loadoutChannelId);

  if (loadoutChannel?.isTextBased() && !loadoutChannel.isDMBased()) {
    const embed: EmbedBuilder = new EmbedBuilder()
      .setTitle(`${player.name}`)
      .setColor(0xe67e22) // Orange - pending
      .addFields(
        { name: 'Squad', value: player.squad, inline: true },
        { name: 'Role', value: player.role, inline: true },
        { name: 'Weight', value: weight !== null ? `${weight} kg` : 'N/A', inline: true },
        { name: 'Export Code', value: '```\n' + player.loadout.slice(0, 1000) + '\n```' }
      )
      .setFooter({ text: `Submitted by ${interaction.user.username} • Pending approval` })
      .setTimestamp();

    /**
     * Create approval button.
     * customId format: `approve__${discordId}`
     */
    const approveBtn: ButtonBuilder = new ButtonBuilder()
      .setCustomId(`approve__${interaction.user.id}`)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    /**
     * Create rejection button.
     * customId format: `reject__${discordId}`
     */
    const rejectBtn: ButtonBuilder = new ButtonBuilder()
      .setCustomId(`reject__${interaction.user.id}`)
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🚮');

    const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(approveBtn, rejectBtn);

    await loadoutChannel.send({
      embeds: [embed],
      components: [row],
    });
  }

  // ============================================================================
  // CONFIRMATION
  // ============================================================================
  return interaction.reply({
    content: `Loadout submitted!`,
    ephemeral: true,
  });
}
