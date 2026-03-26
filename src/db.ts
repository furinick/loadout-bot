import fs from 'fs';
import path from 'path';
import type { DB } from './types.js';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export function loadDB(): DB {
  if (!fs.existsSync('data')) fs.mkdirSync('data');
  if (!fs.existsSync(DB_PATH))
    fs.writeFileSync(DB_PATH, JSON.stringify({ config: {}, players: {} }, null, 2));
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

export function saveDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
