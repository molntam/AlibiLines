import test from "node:test";
import assert from "node:assert/strict";

import { hotelCase } from "../src/case.js";
import {
  canMove,
  clueSatisfied,
  createInitialPaths,
  findKiller,
  getRoomId,
  getWalkableCells,
  isAdjacent,
  isBlocked,
  pathsEqual,
  validateBoard
} from "../src/game-logic.js";

test("orthogonal movement is accepted and diagonal movement is rejected", () => {
  assert.equal(isAdjacent(0, 1, 7), true);
  assert.equal(isAdjacent(0, 7, 7), true);
  assert.equal(isAdjacent(0, 8, 7), false);
  assert.equal(isAdjacent(6, 7, 7), false);
});

test("room walls require a passage and furniture blocks movement", () => {
  assert.equal(canMove(hotelCase, 0, 1), true);
  assert.equal(canMove(hotelCase, 9, 10), true);
  assert.equal(canMove(hotelCase, 16, 23), false);
  assert.equal(canMove(hotelCase, 7, 8), false);
});

test("floor-plan data keeps passages and blocked objects valid", () => {
  const endpointCells = new Set(hotelCase.suspects.flatMap((suspect) => [suspect.start, suspect.end]));
  for (const passage of hotelCase.passages) {
    const [from, to] = passage.cells;
    assert.equal(isAdjacent(from, to, hotelCase.size), true, passage.label);
    assert.notEqual(getRoomId(hotelCase, from), getRoomId(hotelCase, to), passage.label);
    assert.equal(isBlocked(hotelCase, from) || isBlocked(hotelCase, to), false, passage.label);
  }
  for (const object of hotelCase.objects) assert.equal(endpointCells.has(object.cell), false, object.label);
  assert.equal(
    hotelCase.suspects.reduce((total, suspect) => total + suspect.length, 0),
    getWalkableCells(hotelCase).length,
  );
});

test("initial paths contain only the confirmed starting sightings", () => {
  const paths = createInitialPaths(hotelCase);
  for (const suspect of hotelCase.suspects) assert.deepEqual(paths[suspect.id], [suspect.start]);
});

test("the authored solution covers every open tile and identifies Elias", () => {
  const result = validateBoard(hotelCase, hotelCase.solution);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(getWalkableCells(hotelCase).length, 45);
  assert.equal(result.killer?.id, "elias");
  assert.equal(findKiller(hotelCase, hotelCase.solution)?.id, "elias");
});

test("Nora's camera order eliminates the alternate reconstruction", () => {
  const nora = hotelCase.suspects.find((suspect) => suspect.id === "nora");
  const alternate = [23, 22, 29, 30, 37, 36, 43, 42, 35, 28, 21];
  assert.equal(clueSatisfied(nora, hotelCase.solution.nora), true);
  assert.equal(clueSatisfied(nora, alternate), false);
});

test("an incomplete board cannot be submitted", () => {
  const result = validateBoard(hotelCase, createInitialPaths(hotelCase));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("open floor tiles")));
});

test("path comparison detects a changed route", () => {
  assert.equal(pathsEqual(hotelCase.solution, structuredClone(hotelCase.solution)), true);
  const changed = structuredClone(hotelCase.solution);
  changed.sara = changed.sara.slice(0, -1);
  assert.equal(pathsEqual(hotelCase.solution, changed), false);
});
