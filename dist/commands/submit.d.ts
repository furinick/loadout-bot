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
import { ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
/**
 * Slash command definition.
 *
 * Defines the command name, description, and required options:
 * - `name`: In-game player name
 * - `role`: Character role — autocompleted at startup from config
 * - `squad`: Squad assignment — autocompleted at startup from config
 * - `loadout`: Raw ACE Arsenal SQF export string
 */
export declare const data: import("discord.js").SlashCommandOptionsOnlyBuilder;
/**
 * Handles autocomplete interactions for the submit command.
 *
 * Responds with filtered role or squad options from the config,
 * matching what the user has typed so far.
 *
 * @param interaction - The Discord autocomplete interaction
 */
export declare function autocomplete(interaction: AutocompleteInteraction): Promise<void>;
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
export declare function execute(interaction: ChatInputCommandInteraction): Promise<import("discord.js").InteractionResponse<boolean>>;
//# sourceMappingURL=submit.d.ts.map