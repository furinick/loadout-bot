// ACE Arsenal loadout format:
// [
//   [primary weapon array],    // [classname, muzzle, pointer, optic, [mag, ammo], [underbarrel], underbarrelMag]
//   [launcher array],
//   [handgun array],
//   [uniform, [[item, count], ...]],
//   [vest, [[item, count], ...]],
//   [backpack, [[item, count], ...]],
//   headgear,
//   goggles,
//   [binoculars array],
//   [map, gps, radio, compass, watch, nvg]
// ]

export interface ItemEntry {
  classname: string;
  count: number;
}

function isClassname(s: unknown): s is string {
  return typeof s === 'string' && s.length > 2 && /^[A-Za-z0-9_]+$/.test(s);
}

function parseWeaponArray(arr: unknown[]): ItemEntry[] {
  const entries: ItemEntry[] = [];
  // arr[0] = classname
  if (isClassname(arr[0])) entries.push({ classname: arr[0], count: 1 });
  // arr[1] = muzzle, arr[2] = pointer, arr[3] = optic, arr[6] = underbarrel
  for (const i of [1, 2, 3, 6]) {
    if (isClassname(arr[i])) entries.push({ classname: arr[i] as string, count: 1 });
  }
  // arr[4] = [magazine, ammoCount], arr[5] = [underbarrel mag, ammoCount]
  for (const i of [4, 5]) {
    const mag = arr[i];
    if (Array.isArray(mag) && isClassname(mag[0])) {
      entries.push({ classname: mag[0], count: 1 });
    }
  }
  return entries;
}

function parseContainerItems(items: unknown[]): ItemEntry[] {
  const entries: ItemEntry[] = [];
  for (const item of items) {
    if (!Array.isArray(item)) continue;
    const [classname, count] = item;
    if (isClassname(classname)) {
      entries.push({ classname, count: typeof count === 'number' ? count : 1 });
    }
  }
  return entries;
}

function parseContainer(arr: unknown): ItemEntry[] {
  if (!Array.isArray(arr) || arr.length < 2) return [];
  const entries: ItemEntry[] = [];
  // arr[0] = container classname
  if (isClassname(arr[0])) entries.push({ classname: arr[0], count: 1 });
  // arr[1] = [[item, count], ...]
  if (Array.isArray(arr[1])) entries.push(...parseContainerItems(arr[1]));
  return entries;
}

export function parseLoadout(loadoutStr: string): ItemEntry[] {
  const entries: ItemEntry[] = [];

  try {
    const raw = JSON.parse(loadoutStr);
    // ACE wraps in outer array: [loadout, aceExtras]
    const loadout = Array.isArray(raw[0]) ? raw[0] : raw;

    // primary weapon (index 0)
    if (Array.isArray(loadout[0]) && loadout[0].length > 0) entries.push(...parseWeaponArray(loadout[0]));
    // launcher (index 1)
    if (Array.isArray(loadout[1]) && loadout[1].length > 0) entries.push(...parseWeaponArray(loadout[1]));
    // handgun (index 2)
    if (Array.isArray(loadout[2]) && loadout[2].length > 0) entries.push(...parseWeaponArray(loadout[2]));
    // uniform (index 3)
    entries.push(...parseContainer(loadout[3]));
    // vest (index 4)
    entries.push(...parseContainer(loadout[4]));
    // backpack (index 5)
    entries.push(...parseContainer(loadout[5]));
    // headgear (index 6)
    if (isClassname(loadout[6])) entries.push({ classname: loadout[6], count: 1 });
    // goggles (index 7)
    if (isClassname(loadout[7])) entries.push({ classname: loadout[7], count: 1 });
    // binoculars (index 8)
    if (Array.isArray(loadout[8]) && loadout[8].length > 0) entries.push(...parseWeaponArray(loadout[8]));
    // linked items (index 9): [map, gps, radio, compass, watch, nvg]
    if (Array.isArray(loadout[9])) {
      for (const item of loadout[9]) {
        if (isClassname(item)) entries.push({ classname: item, count: 1 });
      }
    }
  } catch {
    return [];
  }

  return entries;
}
