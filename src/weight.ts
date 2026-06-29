import fs from 'fs';
import path from 'path';
import { parseLoadout } from './loadout';

const ITEMS_PATH = path.join(process.cwd(), 'data', 'items.json');

type ItemDB = Record<string, number>;

let itemDB: ItemDB | null = null;

/**
 * Loads all game items and their weights
 * We have all items and their weights stored in 'data/items.json'
 * results are cached in memory after first load
 * @returns {ItemDB} Item database with names mapped to their weights
 */
function loadItems(): ItemDB {
  if (itemDB) return itemDB;
  if (!fs.existsSync(ITEMS_PATH)) return {};
  itemDB = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));
  return itemDB!;
}

/**
 * Converts ARMA 3 mass units to kilograms
 * Arma 3 uses an arbitrary unit system where 1 unit = 0.1 kg / 2.2046 lbs
 * @param {number} mass - mass in ARMA 3 units
 * @returns {number} Mass in kilograms
 */
function massToKg(mass: number): number {
  return mass * 0.1 / 2.2046;
}

/**
 * Calculates the total weight in KG of a loadout
 * Items not found in the database are skipped
 * Weight is rounded to 2 decimal places
 *
 * @param {string} loadout - ACE arsenal extracted loadout string
 * @returns {number | null} Weight in KG, or null if items database is empty or loadout cannot be parsed
 */
export function calculateWeight(loadout: string): number | null {
  const items = loadItems();
  if (Object.keys(items).length === 0) return null;

  const entries = parseLoadout(loadout);
  if (entries.length === 0) return null;

  let total = 0;
  for (const { classname, count } of entries) {
    if (items[classname]) total += massToKg(items[classname]) * count;
  }
  return Math.round(total * 100) / 100;
}
