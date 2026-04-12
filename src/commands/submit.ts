import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';
import { loadDB, saveDB } from '../db.js';
import type { Player, Role, Squad } from '../types.js';
import { calculateWeight } from '../weight.js';

export const data = new SlashCommandBuilder()
  .setName('submit')
  .setDescription('Submit your loadout for approval')
  .addStringOption(opt =>
    opt.setName('name').setDescription('Your in-game name').setRequired(true))
  .addStringOption(opt =>
    opt.setName('role').setDescription('Your role').setRequired(true)
      .addChoices(
        { name: 'Rifleman', value: 'rifleman' },
        { name: 'Light AT', value: 'LAT' },
        { name: 'Heavy AT', value: 'HAT' },
        { name: 'Team Leader', value: 'TL' },
        { name: 'Squad Leader', value: 'SL' },
        { name: 'Grenadier', value: 'grenadier' },
        { name: 'Medic', value: 'medic' },
        { name: 'Engineer', value: 'engineer' },
        { name: 'Drone Operator', value: 'drone operator' },
        { name: 'Machinegunner', value: 'machinegunner' },
        { name: 'Autorifleman', value: 'autorifleman' }
      ))
  .addStringOption(opt =>
    opt.setName('squad').setDescription('Your squad').setRequired(true)
      .addChoices(
        { name: 'Aglet', value: 'aglet' },
        { name: 'Buster', value: 'buster' },
        { name: 'Platoon', value: 'platoon' },
      ))
  .addStringOption(opt =>
    opt.setName('loadout').setDescription('Paste your ACE Arsenal SQF export here').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const db = loadDB();

  // Check correct channel
  if (db.config.loadoutChannel && interaction.channelId !== db.config.loadoutChannel) {
    return interaction.reply({
      content: `Please submit in <#${db.config.loadoutChannel}>.`,
      ephemeral: true,
    });
  }

  // Check duplicate
  if (db.players[interaction.user.id]) {
    return interaction.reply({
      content: `You already have a submission. Use \`/remove\` first if you want to resubmit.`,
      ephemeral: true,
    });
  }

  const player: Player = {
    discordUID: interaction.user.id,
    name: interaction.options.getString('name', true),
    role: interaction.options.getString('role', true) as Role,
    squad: interaction.options.getString('squad', true) as Squad,
    loadout: interaction.options.getString('loadout', true),
    status: 'pending',
    submittedAt: Date.now(),
  };

  const weight = calculateWeight(player.loadout);


  db.players[interaction.user.id] = player;
  saveDB(db);

  // Post public embed to loadout channel
  const loadoutChannelId = db.config.loadoutChannel ?? interaction.channelId;
  const loadoutChannel = await interaction.client.channels.fetch(loadoutChannelId);

  if (loadoutChannel?.isTextBased() && !loadoutChannel.isDMBased()) {
    const embed = new EmbedBuilder()
      .setTitle(`${player.name}`)
      .setColor(0xE67E22)
      .addFields(
        { name: 'Squad', value: player.squad, inline: true },
        { name: 'Role', value: player.role, inline: true },
        { name: 'Weight', value: weight !== null ? `${weight} kg` : 'N/A', inline: true },
        { name: 'Export Code', value: '```\n' + player.loadout.slice(0, 1000) + '\n```' },
      )
      .setFooter({ text: `Submitted by ${interaction.user.username} • Pending approval` })
      .setTimestamp();

    const approveBtn = new ButtonBuilder()
      .setCustomId(`approve__${interaction.user.id}`)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const rejectBtn = new ButtonBuilder()
      .setCustomId(`reject__${interaction.user.id}`)
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🚮');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approveBtn, rejectBtn);

    await loadoutChannel.send({ embeds: [embed], components: [row] });
  }

  return interaction.reply({
    content: `Loadout submitted!`,
    ephemeral: true,
  });
}
