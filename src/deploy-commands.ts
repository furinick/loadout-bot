import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadCommands } from './load-commands';

dotenv.config();

const commands = await loadCommands();
const commandsData = commands.map(cmd => cmd.data.toJSON());


const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
      { body: commandsData }
    );
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
})();
