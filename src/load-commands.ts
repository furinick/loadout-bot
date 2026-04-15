import fs from 'fs';
import path from 'path';
import { Collection } from 'discord.js';
import type { Command } from './types.ts';


export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();
  const comandsPath = path.join(process.cwd(), 'src', 'commands');
  const files = fs.readdirSync(comandsPath);
  const commandFiles = files.filter(files => files.endsWith('.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(comandsPath, file);
    const command = await import(filePath);
    const cmd = command;
    if (!cmd.data || !cmd.execute) {
      console.warn(`Invalid command file: ${file}`);
      continue;
    }
    commands.set(cmd.data.name, cmd);
  }
  return commands;
}
