// progress_quickcheck.js
function calcProgress(plannedPath, startId, destId, currentId, mode = "nodes") {
  const idx = (id) => {
    const i = plannedPath.indexOf(id);
    if (i === -1) throw new Error(`AccessPoint ${id} not on plannedPath`);
    return i;
  };
  const s = idx(startId), d = idx(destId);
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
function calcPayoutDelta(basePoints, prevProgress, newProgress) {
  const delta = Math.max(0, newProgress - prevProgress);
  return basePoints * delta;
}
function testCase(name, { path, start, dest, drops, base, mode }) {
  let prev = 0, awarded = 0;
  console.log(`\n=== ${name} ===`);
  console.log({ path, start, dest, base, mode });
  for (const ap of drops) {
    const { progress } = calcProgress(path, start, dest, ap, mode);
    const award = calcPayoutDelta(base, prev, progress);
    awarded += award;
    console.log(`Drop @ ${ap} -> progress ${(progress*100).toFixed(1)}% | award ${award.toFixed(2)} | total ${awarded.toFixed(2)}`);
    prev = progress;
  }
  console.log(`TOTAL awarded = ${awarded.toFixed(2)}\n`);
}
testCase("3 APs, hops (1→3, drop at 2 => 50%)", {
  path: ["ap1", "ap2", "ap3"], start: "ap1", dest: "ap3",
  drops: ["ap2", "ap3"], base: 10, mode: "hops",
});
testCase("5 APs, nodes (1→5, drop at 4 then 5 => 4/5 + 1/5)", {
  path: ["ap1", "ap2", "ap3", "ap4", "ap5"], start: "ap1", dest: "ap5",
  drops: ["ap4", "ap5"], base: 5, mode: "nodes",
});
testCase("5 APs, hops (3/4 + 1/4)", {
  path: ["ap1", "ap2", "ap3", "ap4", "ap5"], start: "ap1", dest: "ap5",
  drops: ["ap4", "ap5"], base: 5, mode: "hops",
});
