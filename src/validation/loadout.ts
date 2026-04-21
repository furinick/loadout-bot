/**
 * ACE Arsenal Loadout Validator
 * Validates the JSON structure exported by ACE Arsenal in Arma 3.
 *
 * Top-level format:
 *   [ LoadoutSlots, Settings ]
 *
 * LoadoutSlots (10 elements):
 *   [0]  Primary weapon   — WeaponSlot
 *   [1]  Secondary weapon — WeaponSlot
 *   [2]  Handgun          — WeaponSlot
 *   [3]  Uniform          — ContainerSlot
 *   [4]  Vest             — ContainerSlot
 *   [5]  Backpack         — ContainerSlot
 *   [6]  Helmet           — string
 *   [7]  Goggles          — string
 *   [8]  Binocular/item   — WeaponSlot
 *   [9]  Linked items     — LinkedItems (6-element string array)
 *
 * WeaponSlot:   [class, muzzle, flashlight, optic, primaryMag, secondaryMag, bipod]
 *   primaryMag / secondaryMag: [] | [class, count]
 *
 * ContainerSlot: [class, items]
 *   items: Array<[class, count] | [class, count, uses]>
 *
 * Settings (index 1): Array<[key, value]>
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Severity = "error" | "warning";

export interface Issue {
  severity: Severity;
  slot: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Issue[];
  warnings: Issue[];
  all: Issue[];
}

// Parsed representations (post-validation, for consumers that want typed data)
export type MagSlot = [] | [className: string, count: number];

export interface WeaponSlot {
  className: string;
  muzzle: string;
  flashlight: string;
  optic: string;
  primaryMag: MagSlot;
  secondaryMag: MagSlot;
  bipod: string;
}

export type ContainerItem =
  | [className: string, count: number]
  | [className: string, count: number, uses: number];

export interface ContainerSlot {
  className: string;
  items: ContainerItem[];
}

export type LinkedItems = [
  map: string,
  gps: string,
  radio: string,
  compass: string,
  watch: string,
  terminal: string,
];

export interface SettingsEntry {
  key: string;
  value: unknown;
}

export interface ParsedLoadout {
  primaryWeapon: WeaponSlot;
  secondaryWeapon: WeaponSlot;
  handgun: WeaponSlot;
  uniform: ContainerSlot;
  vest: ContainerSlot;
  backpack: ContainerSlot;
  helmet: string;
  goggles: string;
  binocular: WeaponSlot;
  linkedItems: LinkedItems;
  settings: SettingsEntry[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const SLOT_COUNT = 10;
const LINKED_ITEM_COUNT = 6;
const WEAPON_ELEMENT_COUNT = 7;
const LINKED_SLOT_NAMES = ["map", "gps", "radio", "compass", "watch", "terminal"] as const;

function issue(
  issues: Issue[],
  severity: Severity,
  slot: string,
  message: string,
): void {
  issues.push({ severity, slot, message });
}

function err(issues: Issue[], slot: string, message: string): void {
  issue(issues, "error", slot, message);
}

function warn(issues: Issue[], slot: string, message: string): void {
  issue(issues, "warning", slot, message);
}

// ---------------------------------------------------------------------------
// Slot validators
// ---------------------------------------------------------------------------

function validateWeaponSlot(
  raw: unknown,
  slotName: string,
  issues: Issue[],
): WeaponSlot | null {
  if (!Array.isArray(raw)) {
    err(issues, slotName, `Expected an array, got ${typeof raw}`);
    return null;
  }

  if (raw.length !== WEAPON_ELEMENT_COUNT) {
    err(
      issues,
      slotName,
      `Expected ${WEAPON_ELEMENT_COUNT} elements [class, muzzle, flashlight, optic, primaryMag, secondaryMag, bipod], got ${raw.length}`,
    );
    return null;
  }

  const [cls, muzzle, flashlight, optic, primaryMagRaw, secondaryMagRaw, bipod] = raw;
  let valid = true;

  if (typeof cls !== "string") {
    err(issues, slotName, "Index 0 (class) must be a string");
    valid = false;
  }
  if (typeof muzzle !== "string") {
    err(issues, slotName, "Index 1 (muzzle) must be a string");
    valid = false;
  }
  if (typeof flashlight !== "string") {
    err(issues, slotName, "Index 2 (flashlight) must be a string");
    valid = false;
  }
  if (typeof optic !== "string") {
    err(issues, slotName, "Index 3 (optic) must be a string");
    valid = false;
  }
  if (typeof bipod !== "string") {
    err(issues, slotName, "Index 6 (bipod) must be a string");
    valid = false;
  }

  const primaryMag = validateMagSlot(primaryMagRaw, slotName, "primary mag (index 4)", issues);
  const secondaryMag = validateMagSlot(secondaryMagRaw, slotName, "secondary mag (index 5)", issues);

  if (!valid) return null;

  return {
    className: cls as string,
    muzzle: muzzle as string,
    flashlight: flashlight as string,
    optic: optic as string,
    primaryMag: primaryMag ?? [],
    secondaryMag: secondaryMag ?? [],
    bipod: bipod as string,
  };
}

function validateMagSlot(
  raw: unknown,
  slotName: string,
  label: string,
  issues: Issue[],
): MagSlot | null {
  if (!Array.isArray(raw)) {
    err(issues, slotName, `${label} must be an array ([] or [class, count])`);
    return null;
  }

  if (raw.length === 0) return [];

  if (raw.length !== 2) {
    warn(issues, slotName, `${label} should be [] or [class, count], got length ${raw.length}`);
    return null;
  }

  const [magClass, magCount] = raw;

  if (typeof magClass !== "string") {
    err(issues, slotName, `${label} index 0 (mag class) must be a string`);
    return null;
  }
  if (typeof magCount !== "number") {
    err(issues, slotName, `${label} index 1 (count) must be a number`);
    return null;
  }
  if (magCount < 0) {
    warn(issues, slotName, `${label} count is negative (${magCount})`);
  }

  return [magClass, magCount];
}

function validateContainerSlot(
  raw: unknown,
  slotName: string,
  issues: Issue[],
): ContainerSlot | null {
  if (!Array.isArray(raw)) {
    err(issues, slotName, `Expected an array [class, items], got ${typeof raw}`);
    return null;
  }

  if (raw.length !== 2) {
    err(issues, slotName, `Expected 2 elements [class, items], got ${raw.length}`);
    return null;
  }

  const [cls, itemsRaw] = raw;

  if (typeof cls !== "string") {
    err(issues, slotName, "Index 0 (class) must be a string");
  }

  if (!Array.isArray(itemsRaw)) {
    err(issues, slotName, "Index 1 (items) must be an array");
    return null;
  }

  const items: ContainerItem[] = [];

  for (let i = 0; i < itemsRaw.length; i++) {
    const item = itemsRaw[i];
    const label = `items[${i}]`;

    if (!Array.isArray(item)) {
      err(issues, slotName, `${label} must be an array`);
      continue;
    }
    if (item.length < 2 || item.length > 3) {
      warn(
        issues,
        slotName,
        `${label} should be [class, count] or [class, count, uses], got length ${item.length}`,
      );
      continue;
    }

    const [itemClass, itemCount, itemUses] = item;

    if (typeof itemClass !== "string") {
      err(issues, slotName, `${label} index 0 (class) must be a string`);
      continue;
    }
    if (typeof itemCount !== "number") {
      err(issues, slotName, `${label} "${itemClass}" index 1 (count) must be a number`);
      continue;
    }
    if (itemCount < 1) {
      warn(issues, slotName, `${label} "${itemClass}" count is ${itemCount} (zero or negative)`);
    }
    if (item.length === 3 && typeof itemUses !== "number") {
      warn(issues, slotName, `${label} "${itemClass}" index 2 (uses/charges) should be a number`);
    }

    if (item.length === 3) {
      items.push([itemClass, itemCount, itemUses as number]);
    } else {
      items.push([itemClass, itemCount]);
    }
  }

  return { className: cls as string, items };
}

function validateLinkedItems(
  raw: unknown,
  slotName: string,
  issues: Issue[],
): LinkedItems | null {
  if (!Array.isArray(raw)) {
    err(issues, slotName, `Expected an array of ${LINKED_ITEM_COUNT} strings, got ${typeof raw}`);
    return null;
  }

  if (raw.length !== LINKED_ITEM_COUNT) {
    err(
      issues,
      slotName,
      `Expected exactly ${LINKED_ITEM_COUNT} elements [${LINKED_SLOT_NAMES.join(", ")}], got ${raw.length}`,
    );
  }

  for (let i = 0; i < raw.length; i++) {
    if (typeof raw[i] !== "string") {
      err(
        issues,
        slotName,
        `Index ${i} (${LINKED_SLOT_NAMES[i] ?? "unknown"}) must be a string`,
      );
    }
  }

  // Return what we have even if length is off, padded with empty strings
  const padded = [...raw];
  while (padded.length < LINKED_ITEM_COUNT) padded.push("");
  return padded.slice(0, LINKED_ITEM_COUNT) as LinkedItems;
}

function validateSettings(
  raw: unknown,
  issues: Issue[],
): SettingsEntry[] {
  const slotName = "Settings";

  if (!Array.isArray(raw)) {
    err(issues, slotName, `Expected an array, got ${typeof raw}`);
    return [];
  }

  const entries: SettingsEntry[] = [];

  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    const label = `entry[${i}]`;

    if (!Array.isArray(entry) || entry.length < 2) {
      warn(issues, slotName, `${label} should be [key, value]`);
      continue;
    }

    const [key, value] = entry;

    if (typeof key !== "string") {
      warn(issues, slotName, `${label} key must be a string`);
      continue;
    }

    // Validate known setting keys
    switch (key) {
      case "ace_arsenal_insignia":
        if (typeof value !== "string") {
          warn(issues, slotName, `"${key}" value should be a string`);
        }
        break;
      case "ace_earplugs":
        if (typeof value !== "boolean") {
          warn(issues, slotName, `"${key}" value should be a boolean`);
        }
        break;
    }

    entries.push({ key, value });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate a parsed ACE Arsenal loadout array.
 *
 * @param raw  The value produced by JSON.parse() on the exported loadout string.
 * @returns    A ValidationResult with error/warning lists and an optional parsed loadout.
 */
export function validateLoadout(raw: unknown): ValidationResult & { parsed: ParsedLoadout | null } {
  const issues: Issue[] = [];

  if (!Array.isArray(raw)) {
    err(issues, "Root", `Loadout must be an array, got ${typeof raw}`);
    return buildResult(issues, null);
  }

  if (raw.length < 1 || raw.length > 2) {
    err(
      issues,
      "Root",
      `Expected 2 top-level elements [loadout, settings], got ${raw.length}`,
    );
  }

  const loadoutRaw = raw[0];
  const settingsRaw = raw[1];

  if (!Array.isArray(loadoutRaw)) {
    err(issues, "Root", `Index 0 (loadout slots) must be an array, got ${typeof loadoutRaw}`);
    return buildResult(issues, null);
  }

  if (loadoutRaw.length !== SLOT_COUNT) {
    err(
      issues,
      "Root",
      `Loadout must have exactly ${SLOT_COUNT} slots, got ${loadoutRaw.length}`,
    );
  }

  const primaryWeapon = validateWeaponSlot(loadoutRaw[0], "Primary weapon", issues);
  const secondaryWeapon = validateWeaponSlot(loadoutRaw[1], "Secondary weapon", issues);
  const handgun = validateWeaponSlot(loadoutRaw[2], "Handgun", issues);
  const uniform = validateContainerSlot(loadoutRaw[3], "Uniform", issues);
  const vest = validateContainerSlot(loadoutRaw[4], "Vest", issues);
  const backpack = validateContainerSlot(loadoutRaw[5], "Backpack", issues);

  let helmet = "";
  let goggles = "";

  if (loadoutRaw[6] !== undefined) {
    if (typeof loadoutRaw[6] !== "string") {
      err(issues, "Helmet", "Must be a string (class name or empty string)");
    } else {
      helmet = loadoutRaw[6];
    }
  }

  if (loadoutRaw[7] !== undefined) {
    if (typeof loadoutRaw[7] !== "string") {
      err(issues, "Goggles", "Must be a string (class name or empty string)");
    } else {
      goggles = loadoutRaw[7];
    }
  }

  const binocular = validateWeaponSlot(loadoutRaw[8], "Binocular / item", issues);
  const linkedItems = validateLinkedItems(loadoutRaw[9], "Linked items", issues);
  const settings = settingsRaw !== undefined ? validateSettings(settingsRaw, issues) : [];

  const allSlotsOk =
    primaryWeapon && secondaryWeapon && handgun &&
    uniform && vest && backpack &&
    binocular && linkedItems;

  const parsed: ParsedLoadout | null = allSlotsOk
    ? {
      primaryWeapon,
      secondaryWeapon,
      handgun,
      uniform,
      vest,
      backpack,
      helmet,
      goggles,
      binocular,
      linkedItems,
      settings,
    }
    : null;

  return buildResult(issues, parsed);
}

/**
 * Convenience wrapper — parses the JSON string first, then validates.
 *
 * @param jsonString  Raw string as exported by ACE Arsenal.
 */
export function validateLoadoutString(
  jsonString: string,
): ValidationResult & { parsed: ParsedLoadout | null } {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString);
  } catch (e) {
    const issues: Issue[] = [
      {
        severity: "error",
        slot: "Root",
        message: `SQF parse failed: \`${(e as Error).message}\``,
      },
    ];
    return buildResult(issues, null);
  }
  return validateLoadout(raw);
}

function buildResult(
  issues: Issue[],
  parsed: ParsedLoadout | null,
): ValidationResult & { parsed: ParsedLoadout | null } {
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    all: issues,
    parsed,
  };
}
