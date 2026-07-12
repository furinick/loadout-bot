/**
 * Setup Slash Command
 *
 * Configures bot settings via admin-only subcommands.
 * Requires the Administrator permission to use.
 *
 * Subcommands:
 * - `channel` — Sets the channel where loadout submissions are posted for review
 * - `adminrole` — Sets the role that can approve or reject loadout submissions
 *
 * @module setup-command
 */
import { ChatInputCommandInteraction } from 'discord.js';
/**
 * Slash command definition.
 *
 * Restricted to Administrator permission by default.
 * Defines two subcommands: `channel` and `adminrole`.
 */
export declare const data: import("discord.js").SlashCommandSubcommandsOnlyBuilder;
/**
 * Executes the setup command.
 *
 * Reads the active subcommand and updates the corresponding bot config value
 * in the database. All replies are ephemeral (only visible to the invoking admin).
 *
 * Subcommand behaviour:
 * - `channel`: Saves the selected channel's ID to `db.config.loadoutChannel`.
 *   The `/submit` command uses this to restrict where submissions are accepted
 *   and where review embeds are posted.
 * - `adminrole`: Saves the selected role's ID to `db.config.adminRole`.
 *   Members with this role can approve or reject submissions via button interactions,
 *   as a fallback to the Administrator permission check.
 *
 * @param interaction - The Discord interaction from the `/setup` command
 */
export declare function execute(interaction: ChatInputCommandInteraction): Promise<import("discord.js").InteractionResponse<boolean> | undefined>;
//# sourceMappingURL=setup.d.ts.map