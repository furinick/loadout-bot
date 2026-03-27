import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import * as submit from './commands/submit.js';
import * as setup from './commands/setup.js';
import * as remove from './commands/remove.js';

dotenv.config();

const commands = [
  submit.data.toJSON(),
  setup.data.toJSON(),
  remove.data.toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
      { body: commands }
    );
    console.log('Done!');
  } catch (err) {
    console.error(err);
  }
})();
