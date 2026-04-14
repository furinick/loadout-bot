import type { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export type Role = 'rifleman' | 'LAT' | 'HAT' | 'TL' | 'SL' | 'grenadier' | 'medic' | 'engineer' | 'drone operator' | 'machinegunner' | 'autorifleman';
export type Squad = 'aglet' | 'buster' | 'platoon';
export type Status = 'pending' | 'approved' | 'rejected';

export interface Player {
  discordUID: string;
  name: string;
  role: Role;
  squad: Squad;
  loadout: string;
  status: Status;
  submittedAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}

export interface DB {
  config: {
    loadoutChannel?: string;
    adminRole?: string;
  };
  players: Record<string, Player>;
}

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<unknown>;
}
