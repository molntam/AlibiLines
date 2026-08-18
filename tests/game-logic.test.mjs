import test from "node:test";
import assert from "node:assert/strict";

import { hotelCase } from "../src/case.js";
import {
  clueSatisfied,
  createInitialPaths,
  findKiller,
  isAdjacent,
  pathsEqual,
  validateBoard
} from "../src/game-logic.js";

test("orthogonal movement is accepted and diagonal movement is rejected", () => {
  assert.equal(isAdjacent(0, 1, 7), true);
  assert.equal(isAdjacent(0, 7, 7), true);
  assert.equal(isAdjacent(0, 8, 7), false);
  assert.equal(isAdjacent(6, 7, 7), false);
});

test("initial paths contain only the confirmed starting sightings", () => {
  const paths = createInitialPaths(hotelCase);
  for (const suspect of hotelCase.suspects) assert.deepEqual(paths[suspect.id], [suspect.start]);
});

test("the authored solution covers every tile and identifies Elias", () => {
  const result = validateBoard(hotelCase, hotelCase.solution);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.killer?.id, "elias");
  assert.equal(findKiller(hotelCase, hotelCase.solution)?.id, "elias");
});

test("Vivian's camera order is meaningful", () => {
  const vivian = hotelCase.suspects.find((suspect) => suspect.id === "vivian");
  assert.equal(clueSatisfied(vivian, hotelCase.solution.vivian), true);
  assert.equal(clueSatisfied(vivian, [...hotelCase.solution.vivian].reverse()), false);
});

test("an incomplete board cannot be submitted", () => {
  const result = validateBoard(hotelCase, createInitialPaths(hotelCase));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("unassigned")));
});

test("path comparison detects a changed route", () => {
  assert.equal(pathsEqual(hotelCase.solution, structuredClone(hotelCase.solution)), true);
  const changed = structuredClone(hotelCase.solution);
  changed.sara = changed.sara.slice(0, -1);
  assert.equal(pathsEqual(hotelCase.solution, changed), false);
});
