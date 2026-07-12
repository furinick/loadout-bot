/**
 * Generate Mission SQF Slash Command
 *
 * Generates an Arma 3 SQF script that spawns all approved players as units
 * in the 3DEN editor, with their submitted loadouts pre-applied.
 *
 * Command: `/generate`
 *
 * Output:
 * - If the script fits within Discord's 2000 character limit, it is sent inline
 * - Otherwise it is uploaded as `phoenix_setup.sqf` for the user to download
 *
 * Usage in-game:
 * Open the 3DEN debug console (Ctrl + D), paste the script, and execute it.
 *
 * @module generate-command
 */
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
/**
 * Slash command definition.
 *
 * Restricted to Administrator permission — only admins should be generating
 * mission scripts from approved submissions.
 */
export declare const data: SlashCommandBuilder;
/**
 * Executes the generate command.
 *
 * Loads all approved player submissions, generates the SQF script, then replies
 * either with the script inline or as a file attachment if it exceeds Discord's
 * 2000 character message limit.
 *
 * Flow:
 * 1. Load approved players from the database
 * 2. Bail early if no approved submissions exist
 * 3. Generate the SQF script
 * 4. If the formatted message fits in 2000 chars, send it inline
 * 5. Otherwise upload the raw script as `phoenix_setup.sqf`
 *
 * Note: The 2000 char check is against the full formatted `content` string
 * (including the instruction text and code block), not just the raw script.
 * The file attachment contains only the raw SQF.
 *
 * @param interaction - The Discord interaction from the `/generate` command
 */
export declare function execute(interaction: ChatInputCommandInteraction): Promise<import("discord.js").InteractionResponse<boolean>>;
//# sourceMappingURL=generate.d.ts.map