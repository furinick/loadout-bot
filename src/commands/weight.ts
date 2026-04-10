import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { loadDB } from '../db.js';
import { calculateWeight } from '../weight.js';
import fs from 'fs';
import path from 'path';
import { parseLoadout } from '../loadout.js';

const ITEMS_PATH = path.join(process.cwd(), 'data', 'items.json');

export const data = new SlashCommandBuilder()
  .setName('weight')
  .setDescription('Show the weight breakdown of a player\'s loadout')
  .addUserOption(opt =>
    opt.setName('player').setDescription('Player to check (defaults to you)').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  const db = loadDB();
  const target = interaction.options.getUser('player') ?? interaction.user;
  const player = db.players[target.id];

  if (!player) {
    return interaction.reply({ content: `❌ No submission found for **${target.username}**.`, ephemeral: true });
  }

  const items: Record<string, number> = fs.existsSync(ITEMS_PATH)
    ? JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'))
    : {};

  if (Object.keys(items).length === 0) {
    return interaction.reply({ content: '⚠️ No item database found. Run `dump_items.sqf` first.', ephemeral: true });
  }

  try {
    const entries = parseLoadout(player.loadout);

    const found: string[] = [];
    const missing: string[] = [];
    let total = 0;

    for (const { classname, count } of entries) {
      if (classname === '') continue;
      if (items[classname]) {
        const kg = Math.round(items[classname] * 0.1 / 2.2046 * count * 100) / 100;
        total += kg;
        found.push(`\`${classname}\` x ${count} - ${kg} kg`);
      } else {
        missing.push(`\`${classname}\` x ${count}`);
      }
    }

    total = Math.round(total * 100) / 100;

    const foundText = found.length > 0 ? found.join('\n') : 'None';
    const missingText = missing.length > 0 ? missing.slice(0, 20).join('\n') : 'None';

    return interaction.reply({
      content: `**Weight breakdown for ${player.name}**\n\n**Total: ${total}kg**\n\n**Found (${found.length}):**\n${foundText}\n\n**Missing from DB (${missing.length}):**\n${missingText}`,
      ephemeral: false,
    });
  } catch {
    return interaction.reply({ content: '❌ Failed to parse loadout.', ephemeral: true });
  }
}
