import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { loadDB, saveDB } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('remove')
  .setDescription('Remove a player loadout submission')
  .addUserOption(opt =>
    opt.setName('player').setDescription('Player to remove').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const db = loadDB();
  const target = interaction.options.getUser('player') ?? interaction.user;

  const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    (db.config.adminRole && (interaction.member?.roles as any)?.cache?.has(db.config.adminRole));

  // Non-admins can only remove themselves
  if (target.id !== interaction.user.id && !isAdmin) {
    return interaction.reply({
      content: `You can only remove your own submission.`,
      ephemeral: true,
    });
  }

  if (!db.players[target.id]) {
    return interaction.reply({
      content: `No submission found for **${target.username}**.`,
      ephemeral: true,
    });
  }

  delete db.players[target.id];
  saveDB(db);

  return interaction.reply({
    content: `Submission for **${target.username}** removed.`,
    ephemeral: true,
  });
}
