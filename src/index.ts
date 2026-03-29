import { Client, GatewayIntentBits, Collection, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { loadDB, saveDB } from './db.js';
import * as dotenv from 'dotenv';
import * as submit from './commands/submit.js';
import * as setup from './commands/setup.js';
import * as remove from './commands/remove.js';
import * as generate from './commands/generate.js'

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

const commands = new Collection([
  [submit.data.name, submit],
  [setup.data.name, setup],
  [remove.data.name, remove],
  [generate.data.name, generate]
]);

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    const db = loadDB();
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    const isAdmin = member?.permissions.has(PermissionFlagsBits.Administrator) ||
      (db.config.adminRole && member?.roles.cache.has(db.config.adminRole));

    if (!isAdmin) {
      return interaction.reply({ content: '🔒 Admins only.', ephemeral: true });
    }

    console.log('customId: ', interaction.customId);
    const [action, discordId] = interaction.customId.split('__');

    if (!discordId) return interaction.reply({ content: '⚠️ Invalid interaction.', ephemeral: true });

    const player = db.players[discordId]!;

    if (!player) {
      return interaction.reply({ content: '⚠️ Submission not found.', ephemeral: true });
    }

    if (action === 'approve') {
      player.status = 'approved';
      player.reviewedBy = interaction.user.username;
      player.reviewedAt = Date.now();
      saveDB(db);

      const updated = EmbedBuilder.from(interaction.message.embeds[0]!)
        .setColor(0x2ECC71)
        .setFooter({ text: `✅ Approved by ${interaction.user.username}` });

      return interaction.update({ embeds: [updated], components: [] });

    } else if (action === 'reject') {
      player.status = 'rejected';
      player.reviewedBy = interaction.user.username;
      player.reviewedAt = Date.now();
      saveDB(db);

      const updated = EmbedBuilder.from(interaction.message.embeds[0]!)
        .setColor(0xE74C3C)
        .setFooter({ text: `❌ Rejected by ${interaction.user.username}` });

      return interaction.update({ embeds: [updated], components: [] });
    }
  }
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
