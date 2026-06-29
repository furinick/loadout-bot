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

import { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder, PermissionFlagsBits } from 'discord.js';
import { loadDB } from '../db.js';
import type { Player } from '../types.js';

/**
 * Generates an Arma 3 SQF script that creates editor units for each approved player.
 *
 * For each player the script:
 * 1. Stores their loadout in a private variable
 * 2. Creates a base soldier unit (`B_Soldier_F`) in the 3DEN editor,
 *    offset along the X axis by 2 units per player to avoid overlap
 * 3. Sets the unit's display name to the player's in-game name
 * 4. Applies their submitted loadout via `setUnitLoadout`
 *
 * Units are positioned relative to the center of the current screen view
 * (`screenToWorld [0.5, 0.5]`), so run the script with the 3DEN viewport
 * focused on where you want them placed.
 *
 * Note: `date` is computed but currently unused — reserved for future use
 * (e.g. embedding a generation timestamp in the script header).
 *
 * @param players - Array of approved players to generate units for
 * @returns SQF script string ready to paste into the 3DEN debug console
 */
function generateSQF(players: Player[]): string {
  const date = new Date().toISOString().replace('T', ' ').slice(0, 19);

  let out = `private _center = screenToWorld [0.5, 0.5];`;

  players.forEach((player, i) => {
    const offset = i * 2;
    out += `private _loadout${i} = ${player.loadout};\n`;
    out += `private _unit${i} = create3DENEntity ["Object", "B_Soldier_F", [(_center select 0) + ${offset}, _center select 1, _center select 2]];\n`;
    out += `_unit${i} set3DENAttribute ["name", "${player.name}"];\n`;
    out += `_unit${i} setUnitLoadout (_loadout${i} select 0);\n\n`;
  });

  return out;
}

/**
 * Slash command definition.
 *
 * Restricted to Administrator permission — only admins should be generating
 * mission scripts from approved submissions.
 */
export const data = new SlashCommandBuilder()
  .setName('generate')
  .setDescription('Generate the mission setup SQF script')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

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
export async function execute(interaction: ChatInputCommandInteraction) {
  const db = loadDB();

  const approved = Object.values(db.players).filter(p => p.status === 'approved');

  if (approved.length === 0) {
    return interaction.reply({ content: '⚠️ No approved loadouts yet.', ephemeral: true });
  }

  const script = generateSQF(approved);

  const count = approved.length;
  const plural = count !== 1 ? 's' : '';

  const content = `
📦 Setup script generated for **${count} operator${plural}**.

Paste the following into the 3DEN debug console (Ctrl + D) and then execute:

\`\`\`sqf
${script}
\`\`\`
`;

  // Discord hard limit ≈ 2000 chars
  if (content.length > 2000) {
    const file = new AttachmentBuilder(Buffer.from(script, 'utf8'), {
      name: 'phoenix_setup.sqf',
    });

    return interaction.reply({
      content: `📦 Script too large for Discord message. Uploaded as file instead.`,
      files: [file],
      ephemeral: true,
    });
  }

  return interaction.reply({
    content,
    ephemeral: true,
  });
}
