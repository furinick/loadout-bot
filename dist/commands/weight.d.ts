/**
 * Weight Breakdown Slash Command
 *
 * Displays the total weight and itemized weight breakdown of a player's loadout.
 * Requires an item database (`data/items.json`) populated by `dump_items.sqf`.
 *
 * Command: `/weight [player]`
 *
 * @module weight-command
 */
import { ChatInputCommandInteraction } from 'discord.js';
/**
 * Slash command definition.
 *
 * Defines the command name, description, and options as registered with Discord.
 */
export declare const data: import("discord.js").SlashCommandOptionsOnlyBuilder;
/**
 * Executes the weight command.
 *
 * Looks up the target player's loadout, parses all items, and calculates weight
 * using the item database. Displays items found in the database and any missing items.
 *
 * Flow:
 * 1. Resolve target player (option or interaction user)
 * 2. Load player record from database
 * 3. Load item weight database from disk
 * 4. Parse loadout into individual items
 * 5. Calculate weight for each item
 * 6. Display results (total, found items, missing items)
 *
 * @param interaction - The Discord interaction from the `/weight` command
 *
 * @example
 * // User runs: /weight @PlayerName
 * // Response: Weight breakdown showing total and itemized breakdown
 *
 * @example
 * // User runs: /weight (no player specified)
 * // Response: Weight breakdown for the command user
 */
export declare function execute(interaction: ChatInputCommandInteraction): Promise<void | InteractionResponse<boolean> | Message<boolean>>;
//# sourceMappingURL=weight.d.ts.map