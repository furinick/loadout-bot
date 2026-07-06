/**
 * ORBAT Matching Module
 * 
 * Matches approved players to their squad's ORBAT slots.
 * Unmatched slots become vacant placeholders.
 * Players that don't fit any slot are appended as extras.
 * 
 * @module orbat
 */

import type { Player } from './types.js';
import type { ORBAT, ResolvedUnit, ResolvedFireteam, ResolvedSquad } from './types.js';

/**
 * Creates a vacant placeholder unit for an unfilled ORBAT slot.
 * 
 * @param role - The role this slot expects
 * @returns A vacant ResolvedUnit
 */
function vacantUnit(role: string): ResolvedUnit {
  return {
    name: `[VACANT] ${role}`,
    loadout: null,
    role,
    vacant: true,
  };
}

/**
 * Creates a resolved unit from a matched player.
 * 
 * @param player - The matched player
 * @returns A filled ResolvedUnit
 */
function filledUnit(player: Player): ResolvedUnit {
  return {
    name: player.name,
    loadout: player.loadout,
    role: player.role,
    vacant: false,
  };
}

/**
 * Resolves all squads in the ORBAT against the list of approved players.
 * 
 * For each squad:
 * 1. Filter players by squad name
 * 2. Match players to slots by role, in ORBAT order
 * 3. Fill unmatched slots with vacant placeholders
 * 4. Append any extra players that didn't fit a slot
 * 
 * Squads not present in the ORBAT are skipped with a warning.
 * Players in squads not present in the ORBAT are also skipped with a warning.
 * 
 * @param orbat - The ORBAT config
 * @param players - List of approved players
 * @returns Array of resolved squads
 */
export function resolveORBAT(orbat: ORBAT, players: Player[]): ResolvedSquad[] {
  const resolved: ResolvedSquad[] = [];

  for (const [squadName, squadORBAT] of Object.entries(orbat)) {
    // Get all players in this squad
    const squadPlayers = players.filter(p => p.squad === squadName);
    // Track which players have been matched
    const unmatched = [...squadPlayers];

    /**
     * Attempts to match a player to a role slot.
     * Removes the matched player from the unmatched pool.
     * Returns a vacant unit if no match is found.
     */
    function matchSlot(role: string): ResolvedUnit {
      const idx = unmatched.findIndex(p => p.role === role);
      if (idx === -1) return vacantUnit(role);
      const player = unmatched.splice(idx, 1)[0];
      if (!player) return vacantUnit(role);
      return filledUnit(player);
    }

    // Resolve SL
    const sl = matchSlot(squadORBAT.sl);

    // Resolve attachments
    const attachments: ResolvedUnit[] = squadORBAT.attachments.map(role => matchSlot(role));

    // Resolve fireteams
    const fireteams: ResolvedFireteam[] = squadORBAT.fireteams.map(ft => ({
      tl: matchSlot(ft.tl),
      members: ft.members.map(role => matchSlot(role)),
    }));

    // Any players left over didn't fit a slot
    if (unmatched.length > 0) {
      console.log(`ℹ️  ${unmatched.length} extra player(s) in squad "${squadName}" appended outside ORBAT slots.`);
    }

    const extras: ResolvedUnit[] = unmatched.map(filledUnit);

    resolved.push({
      name: squadName,
      sl,
      attachments,
      fireteams,
      extras,
    });
  }

  // Warn about players whose squad has no ORBAT entry
  const orbatSquads = Object.keys(orbat);
  const orphaned = players.filter(p => !orbatSquads.includes(p.squad));
  if (orphaned.length > 0) {
    console.warn(`⚠️  ${orphaned.length} player(s) belong to squads not in ORBAT and will be skipped: ${[...new Set(orphaned.map(p => p.squad))].join(', ')}`);
  }

  return resolved;
}
