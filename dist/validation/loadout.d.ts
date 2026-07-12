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
export type ContainerItem = [className: string, count: number] | [className: string, count: number, uses: number];
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
    terminal: string
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
export declare function validateLoadout(raw: unknown): ValidationResult & {
    parsed: ParsedLoadout | null;
};
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
export declare function validateLoadoutString(jsonString: string): ValidationResult & {
    parsed: ParsedLoadout | null;
};
//# sourceMappingURL=loadout.d.ts.map