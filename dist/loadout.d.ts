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
export declare function parseLoadout(loadoutStr: string): ItemEntry[];
//# sourceMappingURL=loadout.d.ts.map