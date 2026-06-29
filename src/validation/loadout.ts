/**
 * ACE Arsenal Loadout Validator
 * 
 * Validates and parses the JSON structure exported by ACE Arsenal in Arma 3.
 * Provides detailed error and warning reporting for invalid loadout data.
 * 
 * **Top-level Format:**
 * ```
 * [LoadoutSlots, Settings]
 * ```
 * 
 * **LoadoutSlots** (10 elements):
 * - [0] Primary weapon — WeaponSlot
 * - [1] Secondary weapon — WeaponSlot
 * - [2] Handgun — WeaponSlot
 * - [3] Uniform — ContainerSlot
 * - [4] Vest — ContainerSlot
 * - [5] Backpack — ContainerSlot
 * - [6] Helmet — string (classname or empty)
 * - [7] Goggles — string (classname or empty)
 * - [8] Binocular/item — WeaponSlot
 * - [9] Linked items — LinkedItems (6-element string array)
 * 
 * **WeaponSlot:**
 * ```
 * [class, muzzle, flashlight, optic, primaryMag, secondaryMag, bipod]
 * ```
 * where primaryMag and secondaryMag are: `[]` or `[class, count]`
 * 
 * **ContainerSlot:**
 * ```
 * [class, items]
 * ```
 * where items is: `Array<[class, count] | [class, count, uses]>`
 * 
 * **Settings** (index 1):
 * Array of `[key, value]` pairs for ACE-specific configuration
 * 
 * @module loadoutValidator
 */

/**
 * Severity level of a validation issue.
 * 
 * - `"error"`: Critical issue that makes the loadout invalid
 * - `"warning"`: Non-critical issue that should be reviewed
 */
export type Severity = "error" | "warning";

/**
 * A single validation issue (error or warning).
 * 
 * @example
 * {
 *   severity: "error",
 *   slot: "Primary weapon",
 *   message: "Expected 7 elements, got 5"
 * }
 */
export interface Issue {
  /** Error or warning level */
  severity: Severity;
  /** Name of the slot where the issue occurred */
  slot: string;
  /** Human-readable description of the problem */
  message: string;
}

/**
 * Result of validating a loadout.
 * 
 * Contains separate lists for errors and warnings, plus a combined list.
 * The `valid` flag is true only if there are no errors.
 * 
 * @example
 * const result = validateLoadout(data);
 * if (!result.valid) {
 *   result.errors.forEach(err => console.error(err.message));
 * }
 */
export interface ValidationResult {
  /** True if no errors were found (warnings are allowed) */
  valid: boolean;
  /** List of all errors that prevent validation */
  errors: Issue[];
  /** List of all non-critical warnings */
  warnings: Issue[];
  /** Combined list of all issues */
  all: Issue[];
}

/**
 * A magazine slot inside a weapon.
 * 
 * - `[]` means empty (no magazine)
 * - `[className, count]` means magazine with ammo count
 * 
 * @example
 * [] // Empty
 * ["30Rnd_556x45_M855A1", 30]
 */
export type MagSlot = [] | [className: string, count: number];

/**
 * A parsed weapon slot with all attachments and magazines.
 * 
 * Represents primary/secondary weapons, handguns, and binoculars.
 * Stores each attachment separately for easy access.
 * 
 * @example
 * {
 *   className: "rhs_weap_m4a1",
 *   muzzle: "rhs_acc_muzzle_mk4",
 *   flashlight: "acc_flashlight",
 *   optic: "optic_acog",
 *   primaryMag: ["30Rnd_556x45_M855A1", 30],
 *   secondaryMag: [],
 *   bipod: ""
 * }
 */
export interface WeaponSlot {
  /** Weapon classname */
  className: string;
  /** Muzzle attachment classname (or empty string) */
  muzzle: string;
  /** Flashlight/laser classname (or empty string) */
  flashlight: string;
  /** Optic/sight classname (or empty string) */
  optic: string;
  /** Primary magazine slot */
  primaryMag: MagSlot;
  /** Secondary magazine slot (for underbarrel launchers) */
  secondaryMag: MagSlot;
  /** Bipod classname (or empty string) */
  bipod: string;
}

/**
 * An item inside a container (uniform, vest, backpack).
 * 
 * May include a uses/charges count for certain item types.
 * 
 * @example
 * ["ACE_Bandage", 5]
 * ["ACE_CplasmaIV", 2, 500]
 */
export type ContainerItem =
  | [className: string, count: number]
  | [className: string, count: number, uses: number];

/**
 * A parsed container slot (uniform, vest, or backpack).
 * 
 * Stores the container itself and all items inside it.
 * 
 * @example
 * {
 *   className: "V_CarrierRigKD_01",
 *   items: [
 *     ["ACE_Bandage", 5],
 *     ["ACE_CplasmaIV", 2]
 *   ]
 * }
 */
export interface ContainerSlot {
  /** Container classname */
  className: string;
  /** Array of items inside the container */
  items: ContainerItem[];
}

/**
 * The 6 linked items slot: map, GPS, radio, compass, watch, terminal.
 * 
 * Each element is a classname (or empty string if not equipped).
 * 
 * @example
 * [
 *   "ItemMap",        // map
 *   "ItemGPS",        // gps
 *   "ItemRadio",      // radio
 *   "ItemCompass",    // compass
 *   "ItemWatch",      // watch
 *   "ACE_Advanced_Binoculars"  // terminal/advanced item
 * ]
 */
export type LinkedItems = [
  map: string,
  gps: string,
  radio: string,
  compass: string,
  watch: string,
  terminal: string,
];

/**
 * A single settings entry (ACE-specific configuration).
 * 
 * @example
 * { key: "ace_arsenal_insignia", value: "some_insignia_class" }
 * { key: "ace_earplugs", value: true }
 */
export interface SettingsEntry {
  /** Setting key */
  key: string;
  /** Setting value (type depends on key) */
  value: unknown;
}

/**
 * A fully parsed and validated loadout.
 * 
 * All slots are guaranteed to be non-null if this is returned from validation.
 * Suitable for consuming in logic that needs strongly-typed loadout data.
 * 
 * @example
 * const result = validateLoadout(data);
 * if (result.valid && result.parsed) {
 *   const weapon = result.parsed.primaryWeapon;
 *   console.log(`Primary: ${weapon.className} with ${weapon.optic}`);
 * }
 */
export interface ParsedLoadout {
  /** Primary weapon with attachments */
  primaryWeapon: WeaponSlot;
  /** Secondary weapon (usually launcher) */
  secondaryWeapon: WeaponSlot;
  /** Handgun */
  handgun: WeaponSlot;
  /** Uniform with contents */
  uniform: ContainerSlot;
  /** Tactical vest with contents */
  vest: ContainerSlot;
  /** Backpack with contents */
  backpack: ContainerSlot;
  /** Helmet classname */
  helmet: string;
  /** Goggles/eyewear classname */
  goggles: string;
  /** Binoculars or alternative item */
  binocular: WeaponSlot;
  /** Map, GPS, radio, compass, watch, terminal */
  linkedItems: LinkedItems;
  /** ACE-specific settings */
  settings: SettingsEntry[];
}

// ============================================================================
// Internal Constants and Helpers
// ============================================================================

const SLOT_COUNT = 10;
const LINKED_ITEM_COUNT = 6;
const WEAPON_ELEMENT_COUNT = 7;
const LINKED_SLOT_NAMES = ["map", "gps", "radio", "compass", "watch", "terminal"] as const;

/**
 * Records a validation issue (error or warning) into the issues list.
 * 
 * @param issues - Array to append to
 * @param severity - Error or warning
 * @param slot - Name of the slot where issue occurred
 * @param message - Description of the problem
 */
function issue(
  issues: Issue[],
  severity: Severity,
  slot: string,
  message: string,
): void {
  issues.push({ severity, slot, message });
}

/**
 * Records a validation error.
 * 
 * @param issues - Array to append to
 * @param slot - Name of the slot where error occurred
 * @param message - Description of the problem
 */
function err(issues: Issue[], slot: string, message: string): void {
  issue(issues, "error", slot, message);
}

/**
 * Records a validation warning.
 * 
 * @param issues - Array to append to
 * @param slot - Name of the slot where warning occurred
 * @param message - Description of the problem
 */
function warn(issues: Issue[], slot: string, message: string): void {
  issue(issues, "warning", slot, message);
}

// ============================================================================
// Slot Validators
// ============================================================================

/**
 * Validates a weapon slot.
 * 
 * Checks that the slot is an array with exactly 7 elements (class, muzzle,
 * flashlight, optic, primaryMag, secondaryMag, bipod). Recursively validates
 * magazine slots.
 * 
 * @param raw - The raw weapon array from the loadout
 * @param slotName - Name for error reporting (e.g., "Primary weapon")
 * @param issues - Array to record validation issues
 * @returns Parsed WeaponSlot or null if validation failed
 */
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

/**
 * Validates a magazine slot.
 * 
 * Magazine slots can be empty `[]` or contain `[classname, ammoCount]`.
 * 
 * @param raw - The raw magazine array
 * @param slotName - Name of the weapon for error reporting
 * @param label - Description of which magazine (for error messages)
 * @param issues - Array to record validation issues
 * @returns Parsed MagSlot or null if validation failed
 */
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

/**
 * Validates a container slot (uniform, vest, or backpack).
 * 
 * Container format: `[classname, [[itemClass, count], ...]]`
 * Items can optionally include a third element for uses/charges.
 * 
 * @param raw - The raw container array
 * @param slotName - Name for error reporting (e.g., "Vest")
 * @param issues - Array to record validation issues
 * @returns Parsed ContainerSlot or null if validation failed
 */
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

/**
 * Validates the linked items slot.
 * 
 * Must contain exactly 6 strings: [map, gps, radio, compass, watch, terminal].
 * Empty strings indicate items are not equipped.
 * 
 * @param raw - The raw linked items array
 * @param slotName - Name for error reporting
 * @param issues - Array to record validation issues
 * @returns Parsed LinkedItems array (padded/truncated to 6 elements)
 */
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

/**
 * Validates the settings array.
 * 
 * Settings are ACE-specific configuration entries: `[key, value]` pairs.
 * Known keys like `ace_arsenal_insignia` and `ace_earplugs` are validated
 * for correct value types, but unknown keys are accepted.
 * 
 * @param raw - The raw settings array
 * @param issues - Array to record validation issues
 * @returns Array of parsed settings entries
 */
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

    // Validate known setting keys and their types
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

// ============================================================================
// Public API
// ============================================================================

/**
 * Validates a parsed ACE Arsenal loadout array.
 * 
 * Checks all 10 loadout slots and optional settings for correct structure and types.
 * Returns validation results including detailed error/warning lists and a parsed
 * loadout object (if validation passes).
 * 
 * @param raw - The value produced by `JSON.parse()` on an ACE Arsenal export string
 * @returns ValidationResult with `.valid`, `.errors`, `.warnings`, and `.parsed` properties
 * 
 * @example
 * const data = JSON.parse(aceExportedString);
 * const result = validateLoadout(data);
 * 
 * if (result.valid) {
 *   console.log(`Loaded ${result.parsed!.primaryWeapon.className}`);
 * } else {
 *   result.errors.forEach(err => console.error(`${err.slot}: ${err.message}`));
 * }
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

  // Validate all 10 slots
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

  // Determine if all critical slots parsed successfully
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
 * Convenience wrapper — parses a JSON string then validates it.
 * 
 * Handles JSON parsing errors gracefully, returning them as a validation error.
 * 
 * @param jsonString - Raw JSON string as exported by ACE Arsenal
 * @returns ValidationResult with `.valid`, `.errors`, `.warnings`, and `.parsed` properties
 * 
 * @example
 * const result = validateLoadoutString(aceExportedJsonString);
 * if (!result.valid) {
 *   result.all.forEach(issue => {
 *     console.log(`[${issue.severity.toUpperCase()}] ${issue.slot}: ${issue.message}`);
 *   });
 * }
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
        message: `JSON parse failed: ${(e as Error).message}`,
      },
    ];
    return buildResult(issues, null);
  }
  return validateLoadout(raw);
}

/**
 * Builds the final ValidationResult object.
 * 
 * Separates issues into errors and warnings, and determines validity
 * (valid only if there are no errors).
 * 
 * @param issues - Array of all validation issues
 * @param parsed - The parsed loadout object (null if validation failed)
 * @returns Complete ValidationResult
 */
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
