/**
 * Calculates the total weight in KG of a loadout
 * Items not found in the database are skipped
 * Weight is rounded to 2 decimal places
 *
 * @param {string} loadout - ACE arsenal extracted loadout string
 * @returns {number | null} Weight in KG, or null if items database is empty or loadout cannot be parsed
 */
export declare function calculateWeight(loadout: string): number | null;
//# sourceMappingURL=weight.d.ts.map