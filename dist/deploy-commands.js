/**
 * Discord Slash Command Deployment Script
 *
 * Registers all slash commands with a specific Discord guild.
 *
 * This script:
 * 1. Loads all command definitions from the commands directory
 * 2. Serializes them to JSON format
 * 3. Registers them with Discord via the REST API
 *
 * Environment Variables:
 * - `DISCORD_TOKEN`: Bot token from Discord Developer Portal
 * - `CLIENT_ID`: Bot application ID
 * - `GUILD_ID`: Discord server ID where commands will be registered
 *
 * Run: `node deploy-commands.ts` (or `npx tsx deploy-commands.ts`)
 *
 * @module deployCommands
 */
import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadCommands } from './load-commands.js';
// Load environment variables from .env file
dotenv.config();
/**
 * Validates that all required environment variables are set.
 *
 * @throws Error if any required variable is missing
 */
function validateEnvironment() {
    const required = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}\n` +
            `Please set these in your .env file.`);
    }
}
/**
 * Main deployment function.
 *
 * Loads commands, converts them to JSON, and registers them with Discord.
 * All commands are registered to a single guild for faster updates during development.
 *
 * Guild-scoped registration (used here):
 * - Takes ~1 second to update
 * - Affects only the specified server
 * - Use for testing and development
 *
 * Global registration (alternative):
 * - Takes ~1 hour to propagate everywhere
 * - Affects all servers the bot is in
 * - Use for production deployments
 *
 * To switch to global registration:
 * ```
 * Routes.applicationCommands(process.env.CLIENT_ID!)
 * ```
 *
 * @throws Error if environment variables are invalid or Discord API call fails
 */
async function deployCommands() {
    // Validate required environment variables
    validateEnvironment();
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;
    const token = process.env.DISCORD_TOKEN;
    console.log('📦 Loading commands...');
    /**
     * Load all command modules from the commands directory.
     *
     * Returns a Collection<string, Command> where each command
     * has a `data` property containing SlashCommandBuilder metadata.
     */
    const commands = await loadCommands();
    console.log(`✅ Loaded ${commands.size} commands`);
    /**
     * Convert each command's SlashCommandBuilder to JSON format.
     *
     * Discord API requires command definitions in JSON:
     * {
     *   name: string,
     *   description: string,
     *   options?: CommandOption[],
     *   ...
     * }
     */
    const commandsData = commands.map(cmd => cmd.data.toJSON());
    // Initialize Discord REST client
    const rest = new REST({ version: '10' }).setToken(token);
    try {
        console.log(`🚀 Registering ${commandsData.length} commands to guild ${guildId}...`);
        /**
         * Register commands with Discord API.
         *
         * Routes.applicationGuildCommands() registers commands to a specific guild.
         * This is the recommended approach for testing/development as it updates instantly.
         *
         * API call:
         * - Method: PUT (replaces all existing commands in the guild)
         * - Endpoint: /applications/{client_id}/guilds/{guild_id}/commands
         * - Body: Array of command definitions
         */
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandsData });
        console.log(`✨ Successfully registered ${commandsData.length} commands!`);
    }
    catch (error) {
        console.error('❌ Failed to register commands:');
        if (error instanceof Error) {
            console.error(`   ${error.message}`);
        }
        else {
            console.error(`   ${error}`);
        }
        process.exit(1);
    }
}
/**
 * Execute the deployment.
 *
 * This IIFE pattern ensures the async function runs at module load time.
 */
deployCommands();
//# sourceMappingURL=deploy-commands.js.map