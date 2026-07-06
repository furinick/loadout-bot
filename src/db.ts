/**
 * Database Persistence Module
 * 
 * Provides functions to load and save the application database from/to disk.
 * The database is stored as JSON in `data/db.json`.
 * Bot configuration is loaded once at startup from `config/config.json`.
 * 
 * @module db
 */
import fs from 'fs';
import path from 'path';
import type { DB } from './types.js';

/**
 * Path to the database file.
 * 
 * Located at: `{project_root}/data/db.json`
 * 
 * @constant
 */
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

/**
 * Loads the database from disk.
 * 
 * If the `data` directory doesn't exist, it is created.
 * If the database file doesn't exist, it is initialized with an empty structure:
 * ```json
 * {
 *   "config": {},
 *   "players": {}
 * }
 * ```
 * 
 * @returns The parsed database object
 * 
 * @example
 * const db = loadDB();
 * console.log(db.config);
 * console.log(db.players);
 */
export function loadDB(): DB {
  // Create data directory if it doesn't exist
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }
  // Initialize database file if it doesn't exist
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify({ config: {}, players: {} }, null, 2)
    );
  }
  // Read and parse the database file
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

/**
 * Saves the database to disk.
 * 
 * Writes the database object as formatted JSON (2-space indentation)
 * to the database file. Overwrites any existing content.
 * 
 * @param db - The database object to save
 * 
 * @example
 * const db = loadDB();
 * db.players['123456'] = { status: 'approved', ... };
 * saveDB(db);
 */
export function saveDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/**
 * Path to the bot configuration file.
 * 
 * Located at: `{project_root}/config/config.json`
 * 
 * @constant
 */
const CONFIG_PATH = path.join(process.cwd(), 'config', 'config.json');

/**
 * Default configuration values.
 * Used as fallback if no config.json exists.
 */
const DEFAULT_CONFIG = {
  roles: [
    "rifleman", "LAT", "HAT", "TL", "SL",
    "grenadier", "medic", "engineer",
    "drone operator", "machinegunner", "autorifleman"
  ],
  squads: ["aglet", "buster", "platoon"]
};

export type BotConfig = typeof DEFAULT_CONFIG;

/**
 * Bot configuration, loaded once at startup.
 * 
 * If no config.json exists, defaults are written to disk and used.
 * To apply config changes, edit config/config.json and redeploy.
 */
export const config: BotConfig = (() => {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn('⚠️  No config.json found, writing defaults. Redeploy after editing config/config.json.');
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return DEFAULT_CONFIG;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
})();
