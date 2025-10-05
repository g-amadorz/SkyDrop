// src/lib/services/progressService.ts
export type DenominatorMode = "hops" | "nodes";

/**
 * Calculate fractional progress along a planned path.
 * - "hops": segments basis (e.g., 1→3 at 2 = 1/2 = 50%)
 * - "nodes": nodes basis (e.g., 1→5 at 4 = 4/5)
 */
export function calcProgress(
  plannedPath: string[],
  startId: string,
  destId: string,
  currentId: string,
  mode: DenominatorMode = "nodes"
) {
  const idx = (id: string) => {
    const i = plannedPath.indexOf(id);
    if (i === -1) throw new Error(`AccessPoint ${id} not on plannedPath`);
    return i;
  };

  const s = idx(startId);
  const d = idx(destId);
  if (d <= s) throw new Error("Destination must come after start on plannedPath");

  const c = idx(currentId);
  const clampedC = Math.max(s, Math.min(c, d));

  const totalHops = d - s;
  const doneHops = clampedC - s;

  if (mode === "hops") {
    const progress = totalHops === 0 ? 1 : doneHops / totalHops;
    return { progress, completedUnits: doneHops, totalUnits: totalHops };
  }

  const totalNodes = (d - s) + 1;
  const doneNodes = (clampedC - s) + 1;
  const progress = totalNodes === 1 ? 1 : doneNodes / totalNodes;
  return { progress, completedUnits: doneNodes, totalUnits: totalNodes };
}

/** Proportional payout for the increase in progress only */
export function calcPayoutDelta(basePoints: number, prevProgress: number, newProgress: number) {
  const delta = Math.max(0, newProgress - prevProgress);
  return basePoints * delta;
}
