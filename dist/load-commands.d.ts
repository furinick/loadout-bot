/**
 * Discord.js Command Loader
 *
 * Dynamically loads Discord slash command modules from the file system
 * and returns a collection ready for command handler registration.
 *
 * @module commandLoader
 */
import { Collection } from 'discord.js';
import type { Command } from './types.js';
/**
 * Command module interface.
 *
 * Each command file must export these properties:
 * - `data`: SlashCommandBuilder or compatible command definition
 * - `execute`: Async function to handle the command interaction
 *
 * @interface CommandModule
 * @example
 * export const data = new SlashCommandBuilder()
 *   .setName('ping')
 *   .setDescription('Replies with pong!');
 *
 * export async function execute(interaction: ChatInputCommandInteraction) {
 *   await interaction.reply('Pong!');
 * }
 */
/**
 * Loads all Discord slash command modules from the commands directory.
 *
 * Scans the `commands` directory for TypeScript files,
 * validates that each file exports required `data` and `execute` properties,
 * and returns a collection indexed by command name for easy lookup.
 *
 * **Directory Structure:**
 * ```
 * ./
 * ├── commands/
 * │   ├── generate.ts
 * │   ├── remove.ts
 * │   ├── setup.ts
 * │   ├── submit.ts
 * │   └── weight.ts
 * ├── validation/
 * │   └── loadout.ts
 * ├── db.ts
 * ├── types.ts
 * └── load-commands.ts
 * ```
 *
 * **File Format:**
 * Each command file must export:
 * - `data`: SlashCommandBuilder with command metadata (name, description, options)
 * - `execute`: Async function that handles the command interaction
 *
 * Invalid files are skipped with a warning; the loader continues processing.
 *
 * @returns Promise resolving to a Discord.js Collection of commands
 *          keyed by command name (e.g., `collection.get('ping')`)
 *
 * @throws Does not throw errors; invalid files are logged and skipped.
 *         Returns empty Collection if commands directory doesn't exist.
 *
 * @example
 * // Load commands on bot startup
 * const client = new Client({ intents: [GatewayIntentBits.Guilds] });
 * const commands = await loadCommands();
 *
 * // Register commands with Discord API
 * const rest = new REST({ version: '10' }).setToken(token);
 * await rest.put(Routes.applicationCommands(clientId), {
 *   body: commands.map(cmd => cmd.data.toJSON())
 * });
 *
 * // Handle incoming commands
 * client.on('interactionCreate', async (interaction) => {
 *   if (!interaction.isChatInputCommand()) return;
 *   const command = commands.get(interaction.commandName);
 *   if (command) {
 *     await command.execute(interaction);
 *   }
 * });

 */
export declare function loadCommands(): Promise<Collection<string, Command>>;
//# sourceMappingURL=load-commands.d.ts.map