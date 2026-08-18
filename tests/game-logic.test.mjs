import test from "node:test";
import assert from "node:assert/strict";

import { hotelCase } from "../src/case.js";
import {
  canMove,
  createInitialPaths,
  evidenceSatisfied,
  findKiller,
  findTimedEncounters,
  formatCaseTime,
  getNextMoveErrors,
  getRoomId,
  isAdjacent,
  isBlocked,
  pathsEqual,
  timelineComplete,
  validateReconstruction,
  validateTimeline
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

test("floor-plan passages connect different rooms without touching blockers", () => {
  for (const passage of hotelCase.passages) {
    const [from, to] = passage.cells;
    assert.equal(isAdjacent(from, to, hotelCase.size), true, passage.label);
    assert.notEqual(getRoomId(hotelCase, from), getRoomId(hotelCase, to), passage.label);
    assert.equal(isBlocked(hotelCase, from) || isBlocked(hotelCase, to), false, passage.label);
  }
});

test("initial timelines contain only each person's first evidenced location", () => {
  const paths = createInitialPaths(hotelCase);
  for (const person of hotelCase.people) {
    const firstEvidence = person.evidence.find((event) => event.type === "point" && event.at === 0);
    assert.deepEqual(paths[person.id], [firstEvidence.cell]);
  }
});

test("one minute may be spent waiting but a departed tile cannot be revisited", () => {
  const nora = hotelCase.people.find((person) => person.id === "nora");
  assert.deepEqual(getNextMoveErrors(hotelCase, nora, [21], 21), []);
  assert.ok(getNextMoveErrors(hotelCase, nora, [21, 28], 21).some((error) => error.includes("cannot return")));
});

test("an exact camera timestamp rejects a move to the wrong tile", () => {
  const vivian = hotelCase.people.find((person) => person.id === "vivian");
  const partial = hotelCase.solution.vivian.slice(0, 4);
  assert.equal(formatCaseTime(hotelCase, partial.length), "21:14");
  assert.ok(getNextMoveErrors(hotelCase, vivian, partial, 4).some((error) => error.includes("North camera N1")));
  assert.deepEqual(getNextMoveErrors(hotelCase, vivian, partial, 3), []);
});

test("the authored timelines satisfy every person's evidence", () => {
  for (const person of hotelCase.people) {
    const path = hotelCase.solution[person.id];
    assert.equal(timelineComplete(hotelCase, person, path), true, person.name);
    assert.equal(validateTimeline(hotelCase, person, path).valid, true, person.name);
    for (const event of person.evidence) assert.equal(evidenceSatisfied(event, path), true, `${person.name}: ${event.title}`);
  }
});

test("overlapping routes are legal and location alone is inconclusive", () => {
  const reconstruction = validateReconstruction(hotelCase, hotelCase.solution);
  assert.equal(reconstruction.valid, true, reconstruction.errors.join("\n"));
  const victimCells = new Set(hotelCase.solution.adrian);
  for (const person of hotelCase.people.filter((entry) => entry.role === "suspect")) {
    assert.ok(hotelCase.solution[person.id].some((cell) => victimCells.has(cell)), person.name);
  }
});

test("the killer stays hidden until all six timelines are complete", () => {
  assert.equal(findKiller(hotelCase, createInitialPaths(hotelCase)), null);
  const incomplete = structuredClone(hotelCase.solution);
  incomplete.adrian.pop();
  assert.equal(findKiller(hotelCase, incomplete), null);
});

test("only Marcus meets Adrian during the forensic attack window", () => {
  const attackEncounters = findTimedEncounters(hotelCase, hotelCase.solution).filter((event) => event.inAttackWindow);
  assert.deepEqual(
    attackEncounters.map(({ suspectId, cell, time }) => ({ suspectId, cell, time })),
    [{ suspectId: "marcus", cell: 24, time: "21:18" }],
  );
  const result = validateReconstruction(hotelCase, hotelCase.solution);
  assert.equal(result.killer?.id, "marcus");
  assert.equal(result.encounter?.time, "21:18");
});

test("path comparison detects a changed timeline", () => {
  assert.equal(pathsEqual(hotelCase.solution, structuredClone(hotelCase.solution)), true);
  const changed = structuredClone(hotelCase.solution);
  changed.sara = changed.sara.slice(0, -1);
  assert.equal(pathsEqual(hotelCase.solution, changed), false);
});
