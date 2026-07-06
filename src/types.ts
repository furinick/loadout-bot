import type { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
/**
 * Arma 3 squad member roles
 */
export type Role = string

/**
 * Squad identifiers for loadout organization
 */
export type Squad = string;

/**
 * Submission review status
 * DO NOT MODIFY, MIGHT BREAK BOT
 */
export type Status = 'pending' | 'approved' | 'rejected';
/**
 * Player loadout submission
 * @property {string} discordUID - Discord user ID
 * @property {string} name - Player's in-game name
 * @property {Role} role - Military role in the squad
 * @property {Squad} squad - Squad assignment
 * @property {string} loadout - ACE arsenal loadout string
 * @property {Status} status - Current submission status
 * @property {number} submittedAt - Timestamp of submission
 * @property {string} [reviewedBy] - Discord username of reviewer (if reviewed)
 * @property {number} [reviewedAt] - Timestamp of review (if reviewed)
 */
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

/**
 * Application database structure
 * Format for bot configuration and all player loadout submissions
 * the actual db is in data/db.json
 * 
 * @property {Object} config - Bot configuration
 *   @property {string} [config.loadoutChannel] - Discord channel ID where /submit command posts results
 *   @property {string} [config.adminRole] - Discord role ID that can approve/reject submissions (fallback to Administrator permission)
 * @property {Record<string, Player>} players - Player submissions indexed by Discord UID
 *   Key: Discord user ID
 *   Value: Player loadout submission object
 */
export interface DB {
  config: {
    loadoutChannel?: string;
    adminRole?: string;
  };
  players: Record<string, Player>;
}

/**
 * Discord command structure
 *
 * @property {SlashCommandBuilder} data - 
 */
export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<unknown>;
}

// ======================================
// Types regarding ORBAT
// ======================================

/**
 * A single fireteam within a squad
 */
export interface Fireteam {
  tl: string;
  members: string[];
}

/**
 * A squad's ORBAT definition
 */
export interface SquadORBAT {
  sl: string;
  attachments: string[];
  fireteams: Fireteam[];
}

/**
 * Full ORBAT definition, keyed by squad name
 */
export type ORBAT = Record<string, SquadORBAT>;

/**
 * A resolved unit slot, either filled by a player or vacant
 */
export interface ResolvedUnit {
  name: string;
  loadout: string | null; // null = vacant, use default
  role: string;
  vacant: boolean;
}

/**
 * A resolved fireteam after matching
 */
export interface ResolvedFireteam {
  tl: ResolvedUnit;
  members: ResolvedUnit[];
}

/**
 * A fully resolved squad after matching players to ORBAT
 */
export interface ResolvedSquad {
  name: string;
  sl: ResolvedUnit;
  attachments: ResolvedUnit[];
  fireteams: ResolvedFireteam[];
  extras: ResolvedUnit[]; // players that didn't fit any slot
}
