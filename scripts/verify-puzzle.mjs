import { hotelCase } from "../src/case.js";
import {
  canMove,
  findKiller,
  findTimedEncounters,
  getNextMoveErrors,
  getRoomId,
  getWalkableCells,
  pathsEqual,
  timelineComplete,
  validateReconstruction
} from "../src/game-logic.js";

const walkableCells = getWalkableCells(hotelCase);
const neighborsByCell = new Map(
  walkableCells.map((cell) => [cell, walkableCells.filter((candidate) => canMove(hotelCase, cell, candidate))]),
);

function canStillReachTimedPoint(person, path) {
  const currentOffset = path.length - 1;
  const currentCell = path.at(-1);
  const row = Math.floor(currentCell / hotelCase.size);
  const col = currentCell % hotelCase.size;

  return person.evidence
    .filter((event) => event.type === "point" && event.at > currentOffset)
    .every((event) => {
      const targetRow = Math.floor(event.cell / hotelCase.size);
      const targetCol = event.cell % hotelCase.size;
      const minimumMoves = Math.abs(row - targetRow) + Math.abs(col - targetCol);
      return minimumMoves <= event.at - currentOffset;
    });
}

function enumerateTimelines(person, limit = 10_000) {
  const start = person.evidence.find((event) => event.type === "point" && event.at === 0)?.cell;
  const path = [start];
  const results = [];

  function walk() {
    if (results.length >= limit) return;
    if (path.length === hotelCase.timeline.endOffset + 1) {
      if (timelineComplete(hotelCase, person, path)) results.push([...path]);
      return;
    }
    if (!canStillReachTimedPoint(person, path)) return;

    const current = path.at(-1);
    for (const next of [current, ...neighborsByCell.get(current)]) {
      if (getNextMoveErrors(hotelCase, person, path, next).length > 0) continue;
      path.push(next);
      walk();
      path.pop();
    }
  }

  walk();
  return results;
}

let failed = false;
const candidates = new Map();

for (const person of hotelCase.people) {
  const routes = enumerateTimelines(person);
  candidates.set(person.id, routes);
  console.log(`${person.name}: ${routes.length} timeline${routes.length === 1 ? "" : "s"} satisfy all evidence`);
  if (routes.length !== 1) {
    console.error(`Expected exactly one evidenced timeline for ${person.name}.`);
    failed = true;
  } else if (!pathsEqual({ [person.id]: routes[0] }, { [person.id]: hotelCase.solution[person.id] })) {
    console.error(`${person.name}'s unique timeline does not match the authored route.`);
    failed = true;
  }
}

const reconstruction = validateReconstruction(hotelCase, hotelCase.solution);
if (!reconstruction.valid) {
  console.error(reconstruction.errors.join("\n"));
  failed = true;
}

const victimPath = hotelCase.solution[hotelCase.victimId];
for (const person of hotelCase.people.filter((entry) => entry.role === "suspect")) {
  const sharedCells = new Set(hotelCase.solution[person.id].filter((cell) => victimPath.includes(cell)));
  if (sharedCells.size === 0) {
    console.error(`${person.name} never crosses Adrian's spatial route.`);
    failed = true;
  }
}

const attackEncounters = findTimedEncounters(hotelCase, hotelCase.solution).filter((encounter) => encounter.inAttackWindow);
if (attackEncounters.length !== 1 || attackEncounters[0].suspectId !== "marcus") {
  console.error(`Expected one attack-window encounter belonging to Marcus; found ${attackEncounters.length}.`);
  failed = true;
}

const killer = findKiller(hotelCase, hotelCase.solution);
if (killer?.id !== "marcus") {
  console.error("The completed reconstruction does not identify Marcus as the sole killer.");
  failed = true;
}

for (const passage of hotelCase.passages) {
  const [from, to] = passage.cells;
  if (getRoomId(hotelCase, from) === getRoomId(hotelCase, to) || !canMove(hotelCase, from, to)) {
    console.error(`Invalid architectural passage: ${passage.label}.`);
    failed = true;
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  const encounter = attackEncounters[0];
  console.log("Verified: all six timelines are individually unique, including legal waits.");
  console.log("Verified: every suspect crosses Adrian's spatial route, so location alone cannot reveal the killer.");
  console.log(`Verified: only ${killer.name} meets Adrian at ${encounter.time} in the ${hotelCase.forensics.attackWindowLabel} attack window.`);
}
