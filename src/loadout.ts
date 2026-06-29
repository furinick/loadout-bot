/**
 * ACE Arsenal Loadout Parser
 * 
 * Parses Arma 3 ACE Arsenal loadout strings into a flat list of items.
 * 
 * @module loadoutParser
 */

/**
 * Represents a single item with its classname and quantity.
 * 
 * @example
 * { classname: "rhs_weap_m4a1", count: 1 }
 */
export interface ItemEntry {
  /** Arma 3 classname identifier */
  classname: string;
  /** Quantity of this item */
  count: number;
}

/**
 * ACE Arsenal loadout format specification.
 * 
 * The loadout is a 10-element array representing a complete character loadout:
 * ```
 * [
 *   [primary weapon array],    // [classname, muzzle, pointer, optic, [mag, ammo], [underbarrel], underbarrelMag]
 *   [launcher array],          // same structure as primary weapon
 *   [handgun array],           // same structure as primary weapon
 *   [uniform, [[item, count], ...]],
 *   [vest, [[item, count], ...]],
 *   [backpack, [[item, count], ...]],
 *   headgear,
 *   goggles,
 *   [binoculars array],        // same structure as primary weapon
 *   [map, gps, radio, compass, watch, nvg]  // linked items (any can be empty string)
 * ]
 * ```
 * 
 * The parser handles both raw loadout format and ACE-wrapped format `[loadout, aceExtras]`.
 * 
 * @interface LoadoutFormat
 */

/**
 * Validates that a value is a valid Arma 3 classname.
 * 
 * A valid classname must be:
 * - A non-empty string
 * - At least 3 characters long
 * - Contain only alphanumeric characters and underscores
 * 
 * @param s - The value to validate
 * @returns True if valid classname, false otherwise
 * 
 * @example
 * isClassname("rhs_weap_m4a1") // true
 * isClassname("B_Soldier_F") // true
 * isClassname("bad name") // false (space)
 * isClassname("x") // false (too short)
 */
function isClassname(s: unknown): s is string {
  return typeof s === 'string' && s.length > 2 && /^[A-Za-z0-9_]+$/.test(s);
}


/**
 * Parses a weapon array and its attachments into individual items.
 * 
 * Weapon arrays contain:
 * - [0]: Weapon classname
 * - [1]: Muzzle attachment (optional)
 * - [2]: Pointer/laser attachment (optional)
 * - [3]: Optic/sight attachment (optional)
 * - [4]: [Magazine classname, ammo count] (optional)
 * - [5]: [Underbarrel magazine, ammo count] (optional)
 * - [6]: Underbarrel attachment classname (optional)
 * 
 * Each attachment is extracted as a separate item entry if it exists.
 * 
 * @param arr - The weapon array to parse
 * @returns Array of extracted items
 * 
 * @example
 * parseWeaponArray(["rhs_weap_m4a1", "rhs_acc_muzzle_mk4", "", "", ["30Rnd_556x45_M855A1", 30]])
 * Returns: [
 *   { classname: "rhs_weap_m4a1", count: 1 },
 *   { classname: "rhs_acc_muzzle_mk4", count: 1 },
 *   { classname: "30Rnd_556x45_M855A1", count: 1 }
 * ]
 */
function parseWeaponArray(arr: unknown[]): ItemEntry[] {
  const entries: ItemEntry[] = [];

  // arr[0] = weapon classname
  if (isClassname(arr[0])) {
    entries.push({ classname: arr[0], count: 1 });
  }

  // arr[1] = muzzle, arr[2] = pointer, arr[3] = optic, arr[6] = underbarrel
  for (const i of [1, 2, 3, 6]) {
    if (isClassname(arr[i])) {
      entries.push({ classname: arr[i] as string, count: 1 });
    }
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


/**
 * Parses items contained within a container (uniform/vest/backpack).
 * 
 * Container items are represented as `[classname, count]` pairs.
 * 
 * @param items - Array of item entries within the container
 * @returns Array of extracted items with their counts
 * 
 * @example
 * parseContainerItems([["ACE_Bandage", 5], ["ACE_CplasmaIV", 2]])
 * Returns: [
 *   { classname: "ACE_Bandage", count: 5 },
 *   { classname: "ACE_CplasmaIV", count: 2 }
 * ]
 */
function parseContainerItems(items: unknown[]): ItemEntry[] {
  const entries: ItemEntry[] = [];

  for (const item of items) {
    if (!Array.isArray(item)) continue;

    const [classname, count] = item;
    if (isClassname(classname)) {
      entries.push({
        classname,
        count: typeof count === 'number' ? count : 1
      });
    }
  }

  return entries;
}


/**
 * Parses a container (uniform/vest/backpack) and its contents.
 * 
 * Container format:
 * - [0]: Container classname
 * - [1]: [[item, count], ...] array of contained items
 * 
 * @param arr - The container array to parse
 * @returns Array of all items (container itself + contents)
 * 
 * @example
 * parseContainer(["V_CarrierRigKD_01", [["ACE_Bandage", 5], ["MAGAZINE_TYPE", 3]]])
 * Returns: [
 *   { classname: "V_CarrierRigKD_01", count: 1 },
 *   { classname: "ACE_Bandage", count: 5 },
 *   { classname: "MAGAZINE_TYPE", count: 3 }
 * ]
 */
function parseContainer(arr: unknown): ItemEntry[] {
  if (!Array.isArray(arr) || arr.length < 2) return [];

  const entries: ItemEntry[] = [];

  // arr[0] = container classname
  if (isClassname(arr[0])) {
    entries.push({ classname: arr[0], count: 1 });
  }

  // arr[1] = [[item, count], ...]
  if (Array.isArray(arr[1])) {
    entries.push(...parseContainerItems(arr[1]));
  }

  return entries;
}

/**
 * Parses an ACE Arsenal loadout string into a flat list of items.
 * 
 * Accepts either a raw loadout array or ACE-wrapped format `[loadout, aceExtras]`.
 * Returns a deduplicated list of all items in the loadout with their quantities.
 * 
 * @param loadoutStr - JSON string representing the loadout
 * @returns Array of all items in the loadout, or empty array if parsing fails
 * 
 * @example
 * const loadout = '[["rhs_weap_m4a1","rhs_acc_muzzle_mk4","","","30Rnd_556x45_M855A1",30],' +
 *   '[],' +
 *   '["hk_usp","",[],[""],"17Rnd_9x19_M17",17],' +
 *   '["U_B_CombatUniform_mcam",[[item1,count1]]],' +
 *   '["V_CarrierRigKD_01",[[item2,count2]]],' +
 *   '["B_Carryall_mcam",[[item3,count3]]],' +
 *   '"H_HelmetB",' +
 *   '"",' +
 *   '[],' +
 *   '["ItemMap","ItemGPS","ItemRadio","ItemCompass","ItemWatch","NVGoggles"]]';
 * 
 * const items = parseLoadout(loadout);
 * // Returns array with all weapons, gear, containers, and items
 * 
 * @throws Returns empty array on JSON parse error (graceful failure)
 */
export function parseLoadout(loadoutStr: string): ItemEntry[] {
  const entries: ItemEntry[] = [];

  try {
    const raw = JSON.parse(loadoutStr);

    // ACE wraps loadouts in outer array: [loadout, aceExtras]
    // Handle both wrapped and unwrapped formats
    const loadout = Array.isArray(raw[0]) ? raw[0] : raw;

    // Index 0: Primary weapon
    if (Array.isArray(loadout[0]) && loadout[0].length > 0) {
      entries.push(...parseWeaponArray(loadout[0]));
    }

    // Index 1: Launcher weapon
    if (Array.isArray(loadout[1]) && loadout[1].length > 0) {
      entries.push(...parseWeaponArray(loadout[1]));
    }

    // Index 2: Handgun
    if (Array.isArray(loadout[2]) && loadout[2].length > 0) {
      entries.push(...parseWeaponArray(loadout[2]));
    }

    // Index 3: Uniform + contents
    entries.push(...parseContainer(loadout[3]));

    // Index 4: Vest + contents
    entries.push(...parseContainer(loadout[4]));

    // Index 5: Backpack + contents
    entries.push(...parseContainer(loadout[5]));

    // Index 6: Headgear
    if (isClassname(loadout[6])) {
      entries.push({ classname: loadout[6], count: 1 });
    }

    // Index 7: Goggles/eyewear
    if (isClassname(loadout[7])) {
      entries.push({ classname: loadout[7], count: 1 });
    }

    // Index 8: Binoculars (uses weapon array format)
    if (Array.isArray(loadout[8]) && loadout[8].length > 0) {
      entries.push(...parseWeaponArray(loadout[8]));
    }

    // Index 9: Linked items [map, gps, radio, compass, watch, nvg]
    if (Array.isArray(loadout[9])) {
      for (const item of loadout[9]) {
        if (isClassname(item)) {
          entries.push({ classname: item, count: 1 });
        }
      }
    }
  } catch {
    // JSON parse error - return empty array
    return [];
  }

  return entries;
}
