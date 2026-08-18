import { hotelCase } from "../src/case.js";
import { clueSatisfied, findKiller, isAdjacent, pathsEqual } from "../src/game-logic.js";

const endpointOwner = new Map();
for (const suspect of hotelCase.suspects) {
  endpointOwner.set(suspect.start, suspect.id);
  endpointOwner.set(suspect.end, suspect.id);
}

function neighbors(cell) {
  const result = [];
  for (let candidate = 0; candidate < hotelCase.size ** 2; candidate += 1) {
    if (isAdjacent(cell, candidate, hotelCase.size)) result.push(candidate);
  }
  return result;
}

function enumeratePaths(suspect) {
  const paths = [];
  const path = [suspect.start];
  const visited = new Set(path);

  function walk(cell) {
    if (path.length === suspect.length) {
      if (cell === suspect.end && clueSatisfied(suspect, path)) paths.push([...path]);
      return;
    }

    const row = Math.floor(cell / hotelCase.size);
    const col = cell % hotelCase.size;
    const endRow = Math.floor(suspect.end / hotelCase.size);
    const endCol = suspect.end % hotelCase.size;
    const remainingMoves = suspect.length - path.length;
    const distance = Math.abs(row - endRow) + Math.abs(col - endCol);
    if (distance > remainingMoves || (remainingMoves - distance) % 2 !== 0) return;

    for (const next of neighbors(cell)) {
      if (visited.has(next)) continue;
      const owner = endpointOwner.get(next);
      if (owner && owner !== suspect.id) continue;
      if (next === suspect.end && path.length !== suspect.length - 1) continue;
      visited.add(next);
      path.push(next);
      walk(next);
      path.pop();
      visited.delete(next);
    }
  }

  walk(suspect.start);
  return paths;
}

const candidates = new Map();
for (const suspect of hotelCase.suspects) {
  const routes = enumeratePaths(suspect);
  candidates.set(suspect.id, routes);
  console.log(`${suspect.name}: ${routes.length} personal routes`);
}

const orderedSuspects = [...hotelCase.suspects].sort(
  (left, right) => candidates.get(left.id).length - candidates.get(right.id).length,
);
const occupied = new Set();
const selection = {};
const solutions = [];

function combine(index) {
  if (solutions.length >= 2) return;
  if (index === orderedSuspects.length) {
    if (occupied.size !== hotelCase.size ** 2) return;
    if (!findKiller(hotelCase, selection)) return;
    solutions.push(structuredClone(selection));
    return;
  }

  const suspect = orderedSuspects[index];
  for (const path of candidates.get(suspect.id)) {
    if (path.some((cell) => occupied.has(cell))) continue;
    for (const cell of path) occupied.add(cell);
    selection[suspect.id] = path;
    combine(index + 1);
    delete selection[suspect.id];
    for (const cell of path) occupied.delete(cell);
  }
}

combine(0);

if (solutions.length !== 1) {
  console.error(`Expected exactly one solution, found ${solutions.length === 2 ? "at least two" : solutions.length}.`);
  process.exitCode = 1;
} else if (!pathsEqual(solutions[0], hotelCase.solution)) {
  console.error("The unique solver result does not match the authored solution.");
  process.exitCode = 1;
} else {
  console.log("Verified: the case has exactly one complete solution.");
  console.log(`Verified: ${findKiller(hotelCase, solutions[0]).name} is the only possible killer.`);
}
