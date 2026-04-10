import fs from 'fs';
import path from 'path';
import { parseLoadout } from './loadout';

const ITEMS_PATH = path.join(process.cwd(), 'data', 'items.json');

type ItemDB = Record<string, number>;

let itemDB: ItemDB | null = null;

function loadItems(): ItemDB {
  if (itemDB) return itemDB;
  if (!fs.existsSync(ITEMS_PATH)) return {};
  itemDB = JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));
  return itemDB!;
}

function massToKg(mass: number): number {
  return mass * 0.1 / 2.2046;
}

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
