import { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder, PermissionFlagsBits } from 'discord.js';
import { loadDB } from '../db.js';
import type { Player } from '../types.js';

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

export const data = new SlashCommandBuilder()
  .setName('generate')
  .setDescription('Generate the mission setup SQF script')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

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

