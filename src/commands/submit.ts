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
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js';
import { loadDB, saveDB } from '../db.js';
import type { Player, Role, Squad } from '../types.js';
import { calculateWeight } from '../weight.js';
import { validateLoadoutString } from '../validation/loadout.js';

/**
 * Slash command definition.
 * 
 * Defines the command name, description, and required options:
 * - `name`: In-game player name
 * - `role`: Character role (rifleman, medic, squad leader, etc.)
 * - `squad`: Squad assignment (aglet, buster, or platoon)
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
      .addChoices(
        { name: 'Rifleman', value: 'rifleman' },
        { name: 'Light AT', value: 'LAT' },
        { name: 'Heavy AT', value: 'HAT' },
        { name: 'Team Leader', value: 'TL' },
        { name: 'Squad Leader', value: 'SL' },
        { name: 'Grenadier', value: 'grenadier' },
        { name: 'Medic', value: 'medic' },
        { name: 'Engineer', value: 'engineer' },
        { name: 'Drone Operator', value: 'drone operator' },
        { name: 'Machinegunner', value: 'machinegunner' },
        { name: 'Autorifleman', value: 'autorifleman' }
      )
  )
  .addStringOption(opt =>
    opt
      .setName('squad')
      .setDescription('Your squad')
      .setRequired(true)
      .addChoices(
        { name: 'Aglet', value: 'aglet' },
        { name: 'Buster', value: 'buster' },
        { name: 'Platoon', value: 'platoon' }
      )
  )
  .addStringOption(opt =>
    opt
      .setName('loadout')
      .setDescription('Paste your ACE Arsenal SQF export here')
      .setRequired(true)
  );

/**
 * Executes the submit command.
 * 
 * Flow:
 * 1. Validate that submission is in the correct channel (if configured)
 * 2. Check for duplicate submissions from the same user
 * 3. Validate the ACE Arsenal loadout format
 * 4. Create player record in database with pending status
 * 5. Calculate loadout weight
 * 6. Post review embed to loadout channel with approve/reject buttons
 * 7. Confirm submission to user (ephemeral)
 * 
 * @param interaction - The Discord interaction from the `/submit` command
 * 
 * @example
 * // User runs: /submit name:"John" role:"Rifleman" squad:"Aglet" loadout:"[...]"
 * // Bot: Validates, saves to DB, posts embed to review channel
 * // User sees: "Loadout submitted!" (ephemeral)
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
    /**
     * Show up to 5 errors to the user.
     * 
     * More detailed validation results can be found in validationResult.all
     * if the user wants to debug further.
     */
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
    role: interaction.options.getString('role', true) as Role,
    squad: interaction.options.getString('squad', true) as Squad,
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
    /**
     * Create the review embed.
     * 
     * Shows the player's name, squad, role, weight, and a truncated
     * preview of the loadout code (first 1000 characters).
     * Orange color indicates pending status.
     */
    const embed: EmbedBuilder = new EmbedBuilder()
      .setTitle(`${player.name}`)
      .setColor(0xe67e22) // Orange - pending
      .addFields(
        {
          name: 'Squad',
          value: player.squad,
          inline: true,
        },
        {
          name: 'Role',
          value: player.role,
          inline: true,
        },
        {
          name: 'Weight',
          value: weight !== null ? `${weight} kg` : 'N/A',
          inline: true,
        },
        {
          name: 'Export Code',
          value: '```\n' + player.loadout.slice(0, 1000) + '\n```',
        }
      )
      .setFooter({
        text: `Submitted by ${interaction.user.username} • Pending approval`,
      })
      .setTimestamp();

    /**
     * Create approval button.
     * 
     * customId format: `approve__${discordId}`
     * This is parsed in the main bot's interactionCreate handler.
     */
    const approveBtn: ButtonBuilder = new ButtonBuilder()
      .setCustomId(`approve__${interaction.user.id}`)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    /**
     * Create rejection button.
     * 
     * customId format: `reject__${discordId}`
     * This is parsed in the main bot's interactionCreate handler.
     */
    const rejectBtn: ButtonBuilder = new ButtonBuilder()
      .setCustomId(`reject__${interaction.user.id}`)
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🚮');

    /**
     * Combine buttons into an action row.
     * 
     * Discord limits button rows to 5 buttons, but we only use 2 here.
     */
    const row: ActionRowBuilder<ButtonBuilder> = new ActionRowBuilder<ButtonBuilder>().addComponents(
      approveBtn,
      rejectBtn
    );

    // Post the embed and buttons to the review channel
    await loadoutChannel.send({
      embeds: [embed],
      components: [row],
    });
  }

  // ============================================================================
  // CONFIRMATION
  // ============================================================================
  /**
   * Confirm submission to the user (ephemeral).
   * 
   * Only the user who submitted sees this message.
   */
  return interaction.reply({
    content: `Loadout submitted!`,
    ephemeral: true,
  });
}
