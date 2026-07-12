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
import { ChatInputCommandInteraction } from 'discord.js';
/**
 * Slash command definition.
 *
 * The `player` option is optional — if omitted, the command targets the invoking user.
 * Restricted to Administrator permission by default, but non-admins can still invoke it
 * to remove their own submission (permission check is handled in `execute`).
 */
export declare const data: import("discord.js").SlashCommandOptionsOnlyBuilder;
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
export declare function execute(interaction: ChatInputCommandInteraction): Promise<import("discord.js").InteractionResponse<boolean>>;
//# sourceMappingURL=remove.d.ts.map