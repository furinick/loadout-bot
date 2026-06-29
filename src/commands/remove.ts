/**
 * Remove Submission Slash Command
 *
 * Removes a player's loadout submission from the database.
 *
 * Command: `/remove [player]`
 *
 * Permission behaviour:
 * - Admins (Administrator permission or configured admin role) can remove any player's submission
 * - Non-admins can only remove their own submission
 *
 * @module remove-command
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { loadDB, saveDB } from '../db.js';

/**
 * Slash command definition.
 *
 * The `player` option is optional — if omitted, the command targets the invoking user.
 * Restricted to Administrator permission by default, but non-admins can still invoke it
 * to remove their own submission (permission check is handled in `execute`).
 */
export const data = new SlashCommandBuilder()
  .setName('remove')
  .setDescription('Remove a player loadout submission')
  .addUserOption(opt =>
    opt.setName('player').setDescription('Player to remove').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

/**
 * Executes the remove command.
 *
 * Resolves the target player, checks permissions, then deletes the player's
 * record from the database if it exists.
 *
 * Flow:
 * 1. Resolve target (provided player option, or the invoking user)
 * 2. Determine if the invoking user is an admin
 * 3. Reject non-admins attempting to remove another user's submission
 * 4. Reject if the target has no submission in the database
 * 5. Delete the record and save
 *
 * Note: The `(interaction.member?.roles as any)` cast is needed because
 * `member.roles` is typed differently for guild vs. API members in discord.js.
 *
 * @param interaction - The Discord interaction from the `/remove` command
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  const db = loadDB();
  const target = interaction.options.getUser('player') ?? interaction.user;

  /**
   * Determine if the invoking user has admin privileges.
   *
   * A user is considered admin if:
   * 1. They have the Administrator permission, OR
   * 2. They have the configured admin role (set via `/setup adminrole`)
   */
  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    (db.config.adminRole && (interaction.member?.roles as any)?.cache?.has(db.config.adminRole));

  // Non-admins can only remove themselves
  if (target.id !== interaction.user.id && !isAdmin) {
    return interaction.reply({
      content: `You can only remove your own submission.`,
      ephemeral: true,
    });
  }

  if (!db.players[target.id]) {
    return interaction.reply({
      content: `No submission found for **${target.username}**.`,
      ephemeral: true,
    });
  }

  delete db.players[target.id];
  saveDB(db);

  return interaction.reply({
    content: `Submission for **${target.username}** removed.`,
    ephemeral: true,
  });
}
