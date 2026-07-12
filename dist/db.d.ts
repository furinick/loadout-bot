import type { DB } from './types.js';
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
export declare function loadDB(): DB;
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
export declare function saveDB(db: DB): void;
/**
 * Default configuration values.
 * Used as fallback if no config.json exists.
 */
declare const DEFAULT_CONFIG: {
    roles: string[];
    squads: string[];
};
export type BotConfig = typeof DEFAULT_CONFIG;
/**
 * Bot configuration, loaded once at startup.
 *
 * If no config.json exists, defaults are written to disk and used.
 * To apply config changes, edit config/config.json and redeploy.
 */
export declare const config: BotConfig;
export {};
//# sourceMappingURL=db.d.ts.map