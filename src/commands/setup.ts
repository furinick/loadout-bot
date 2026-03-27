import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { loadDB, saveDB } from '../db.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configure the loadout bot')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('channels')
      .setDescription('Set the submission and loadout channels')
      .addChannelOption(opt =>
        opt.setName('submission').setDescription('Channel where players submit loadouts').setRequired(true))
      .addChannelOption(opt =>
        opt.setName('loadout').setDescription('Channel where loadouts are posted publicly').setRequired(true))
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

  if (sub === 'channels') {
    db.config.submissionChannel = interaction.options.getChannel('submission', true).id;
    db.config.loadoutChannel = interaction.options.getChannel('loadout', true).id;
    saveDB(db);
    return interaction.reply({
      content: `Submission channel: <#${db.config.submissionChannel}> | Loadout channel: <#${db.config.loadoutChannel}>`,
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
