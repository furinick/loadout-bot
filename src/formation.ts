/**
 * Formation Layout Module
 * 
 * Calculates 3DEN editor positions for all units in resolved squads.
 * Positions are relative to [0, 0] and intended to be offset by
 * screenToWorld [0.5, 0.5] in the generated SQF script.
 * 
 * Formation layout:
 * - Squads are separated by 6m on the X axis (SL to SL)
 * - SL is at the front of each squad (lowest Y)
 * - Attachments are stacked 2m behind the SL in a column
 * - Fireteams spread horizontally, 1m apart on X
 * - Each fireteam member is 2m behind the previous (TL at front)
 * - Extras are appended in a row behind everything else
 * 
 * @module formation
 */

import type { ResolvedSquad, ResolvedUnit } from './types.js';

const SQUAD_SPACING_X = 6;   // meters between squad SLs
const UNIT_SPACING_Y = 2;    // meters between rows (depth)
const FT_SPACING_X = 3;      // meters between fireteams
const MEMBER_SPACING_X = 1;  // meters between members within a fireteam

/**
 * Calculates positions for all units across all squads.
 * 
 * @param squads - Array of resolved squads
 * @returns Map of ResolvedUnit to [x, y] position
 */
export function calculateFormation(squads: ResolvedSquad[]): Map<ResolvedUnit, [number, number]> {
  const positions = new Map<ResolvedUnit, [number, number]>();

  let squadOriginX = 0;

  for (const squad of squads) {
    // Track the furthest Y used in this squad so extras go behind everything
    let maxY = 0;

    // ========================================================================
    // SQUAD LEADER
    // ========================================================================
    positions.set(squad.sl, [squadOriginX, 0]);

    // ========================================================================
    // ATTACHMENTS — stacked behind SL in a column
    // ========================================================================
    let attachmentY = UNIT_SPACING_Y;
    for (const attachment of squad.attachments) {
      positions.set(attachment, [squadOriginX, attachmentY]);
      attachmentY += UNIT_SPACING_Y;
    }
    maxY = Math.max(maxY, attachmentY);

    // ========================================================================
    // FIRETEAMS — spread horizontally, each member stacked behind TL
    // ========================================================================
    const fireteamStartY = attachmentY;

    // Calculate total width of all fireteams to center them under the SL
    const totalFTWidth = squad.fireteams.reduce((acc, ft, i) => {
      const ftWidth = Math.max(1, ft.members.length) * MEMBER_SPACING_X;
      return acc + ftWidth + (i < squad.fireteams.length - 1 ? FT_SPACING_X : 0);
    }, 0);

    let ftX = squadOriginX - totalFTWidth / 2;

    for (const fireteam of squad.fireteams) {
      // TL at the front of the fireteam
      const tlX = ftX + (Math.max(1, fireteam.members.length) * MEMBER_SPACING_X) / 2;
      positions.set(fireteam.tl, [tlX, fireteamStartY]);

      // Members stacked behind TL
      let memberY = fireteamStartY + UNIT_SPACING_Y;
      for (const member of fireteam.members) {
        positions.set(member, [tlX, memberY]);
        memberY += UNIT_SPACING_Y;
      }

      maxY = Math.max(maxY, memberY);
      ftX += Math.max(1, fireteam.members.length) * MEMBER_SPACING_X + FT_SPACING_X;
    }

    // ========================================================================
    // EXTRAS — appended in a row behind everything
    // ========================================================================
    let extraX = squadOriginX - (squad.extras.length - 1) * MEMBER_SPACING_X / 2;
    for (const extra of squad.extras) {
      positions.set(extra, [extraX, maxY + UNIT_SPACING_Y]);
      extraX += MEMBER_SPACING_X;
    }

    // Move origin for next squad
    squadOriginX += SQUAD_SPACING_X;
  }

  return positions;
}
