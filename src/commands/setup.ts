import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { loadDB, saveDB } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configure the loadout bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('channel')
      .setDescription('Set the loadout channel')
      .addChannelOption(opt =>
        opt.setName('loadout').setDescription('Channel where loadouts are posted').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('adminrole')
      .setDescription('Set the role that can approve/reject loadouts')
      .addRoleOption(opt =>
        opt.setName('role').setDescription('Admin/officer role').setRequired(true))
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const db = loadDB();
  const sub = interaction.options.getSubcommand();

  if (sub === 'channel') {
    db.config.loadoutChannel = interaction.options.getChannel('loadout', true).id;
    saveDB(db);
    return interaction.reply({
      content: `Loadout channel: <#${db.config.loadoutChannel}>`,
      ephemeral: true,
    });
  }

  if (sub === 'adminrole') {
    db.config.adminRole = interaction.options.getRole('role', true).id;
    saveDB(db);
    return interaction.reply({
      content: `Admin role set to <@&${db.config.adminRole}>`,
      ephemeral: true,
    });
  }
}
