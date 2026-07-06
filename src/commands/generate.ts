/**
 * Generate Mission SQF Slash Command
 *
 * Generates an Arma 3 SQF script that spawns all approved players as units
 * in the 3DEN editor, with their submitted loadouts pre-applied.
 * Units are arranged in formation based on the ORBAT config.
 * Unfilled slots are spawned as vacant placeholder units.
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
import { loadDB, config } from '../db.js';
import type { ResolvedUnit } from '../types.js';
import { resolveORBAT } from '../orbat.js';
import { calculateFormation } from '../formation.js';

/**
 * Default empty loadout for vacant placeholder units.
 * Spawns a bare unit with no equipment.
 */
const VACANT_LOADOUT = `[[],[],[],["U_BasicBody",[]],["V_PlateCarrier1_rgr",[]],[],"",[],[],[""]]`;

/**
 * Generates an Arma 3 SQF script from a formation position map.
 *
 * For each unit the script:
 * 1. Stores their loadout in a private variable (or uses the vacant default)
 * 2. Creates a base soldier unit in the 3DEN editor at the calculated position
 * 3. Sets the unit's display name
 * 4. Applies their loadout via `setUnitLoadout`
 *
 * Units are positioned relative to the center of the current screen view
 * (`screenToWorld [0.5, 0.5]`), so run the script with the 3DEN viewport
 * focused on where you want them placed.
 *
 * @param positions - Map of resolved units to their [x, y] positions
 * @returns SQF script string ready to paste into the 3DEN debug console
 */
function generateSQF(positions: Map<ResolvedUnit, [number, number]>): string {
  let out = `private _center = screenToWorld [0.5, 0.5];\n`;

  let i = 0;
  for (const [unit, [x, y]] of positions) {
    const loadout = unit.loadout ?? VACANT_LOADOUT;
    out += `private _loadout${i} = ${loadout};\n`;
    out += `private _unit${i} = create3DENEntity ["Object", "B_Soldier_F", [(_center select 0) + ${x}, (_center select 1) + ${y}, _center select 2]];\n`;
    out += `_unit${i} set3DENAttribute ["name", "${unit.name}"];\n`;
    out += `_unit${i} setUnitLoadout (_loadout${i} select 0);\n\n`;
    i++;
  }

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
 * Loads all approved player submissions, resolves them against the ORBAT,
 * calculates formation positions, generates the SQF script, then replies
 * either with the script inline or as a file attachment if it exceeds Discord's
 * 2000 character message limit.
 *
 * Flow:
 * 1. Load approved players from the database
 * 2. Bail early if no approved submissions and no ORBAT defined
 * 3. Resolve players against ORBAT (fills vacant slots)
 * 4. Calculate formation positions
 * 5. Generate SQF script
 * 6. If the formatted message fits in 2000 chars, send it inline
 * 7. Otherwise upload the raw script as `phoenix_setup.sqf`
 *
 * @param interaction - The Discord interaction from the `/generate` command
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  const db = loadDB();
  const approved = Object.values(db.players).filter(p => p.status === 'approved');

  if (approved.length === 0 && Object.keys(config.orbat).length === 0) {
    return interaction.reply({ content: '⚠️ No approved loadouts and no ORBAT defined.', ephemeral: true });
  }

  // Resolve players against ORBAT
  const resolvedSquads = resolveORBAT(config.orbat, approved);

  // Calculate formation positions
  const positions = calculateFormation(resolvedSquads);

  if (positions.size === 0) {
    return interaction.reply({ content: '⚠️ No units to generate.', ephemeral: true });
  }

  const script = generateSQF(positions);

  const count = positions.size;
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
