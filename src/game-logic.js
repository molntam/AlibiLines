export function isAdjacent(a, b, size) {
  const aRow = Math.floor(a / size);
  const aCol = a % size;
  const bRow = Math.floor(b / size);
  const bCol = b % size;
  return Math.abs(aRow - bRow) + Math.abs(aCol - bCol) === 1;
}

export function edgeKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function getBlockingObject(caseData, cell) {
  return caseData.objects?.find((object) => object.cell === cell && object.blocking) ?? null;
}

export function isBlocked(caseData, cell) {
  return Boolean(getBlockingObject(caseData, cell));
}

export function getRoomId(caseData, cell) {
  return caseData.rooms.find((room) => room.cells.includes(cell))?.id ?? null;
}

export function canMove(caseData, from, to) {
  if (!isAdjacent(from, to, caseData.size) || isBlocked(caseData, from) || isBlocked(caseData, to)) return false;
  if (getRoomId(caseData, from) === getRoomId(caseData, to)) return true;
  return caseData.passages.some((passage) => edgeKey(...passage.cells) === edgeKey(from, to));
}

export function getWalkableCells(caseData) {
  return Array.from({ length: caseData.size ** 2 }, (_, cell) => cell).filter((cell) => !isBlocked(caseData, cell));
}

export function getPerson(caseData, personId) {
  return caseData.people.find((person) => person.id === personId);
}

export function getVictim(caseData) {
  return getPerson(caseData, caseData.victimId);
}

export function getStartEvidence(person) {
  return person.evidence.find((event) => event.type === "point" && event.at === 0) ?? null;
}

export function createInitialPaths(caseData) {
  return Object.fromEntries(
    caseData.people.map((person) => {
      const start = getStartEvidence(person);
      return [person.id, start ? [start.cell] : []];
    }),
  );
}

export function formatCaseTime(caseData, offset) {
  const minutes = caseData.timeline.startMinutes + offset * caseData.timeline.minutePerMove;
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function evidenceSatisfied(event, path) {
  if (event.type === "point") return path[event.at] === event.cell;
  if (event.type === "edge") {
    return event.at > 0 && path.length > event.at && edgeKey(path[event.at - 1], path[event.at]) === edgeKey(...event.cells);
  }
  if (event.type === "trace") {
    const [from, to] = event.window;
    return path.some((cell, offset) => offset >= from && offset <= to && cell === event.cell);
  }
  return false;
}

export function getEvidenceState(event, path) {
  if (evidenceSatisfied(event, path)) return "satisfied";
  const currentOffset = path.length - 1;
  const deadline = event.type === "trace" ? event.window[1] : event.at;
  return currentOffset >= deadline ? "missed" : "pending";
}

export function evidenceProgress(person, path) {
  const states = person.evidence.map((event) => getEvidenceState(event, path));
  return {
    satisfied: states.filter((state) => state === "satisfied").length,
    total: states.length,
    missed: states.includes("missed"),
    states
  };
}

export function allEvidenceSatisfied(person, path) {
  return person.evidence.every((event) => evidenceSatisfied(event, path));
}

export function timelineComplete(caseData, person, path) {
  return path.length === caseData.timeline.endOffset + 1 && allEvidenceSatisfied(person, path);
}

export function isSelfRevisit(path, nextCell) {
  return nextCell !== path.at(-1) && path.includes(nextCell);
}

export function getNextMoveErrors(caseData, person, path, nextCell) {
  const errors = [];
  const nextOffset = path.length;
  const from = path.at(-1);
  const totalCells = caseData.size ** 2;

  if (nextOffset > caseData.timeline.endOffset) return ["This timeline already reaches the end of the evidence window."];
  if (!Number.isInteger(nextCell) || nextCell < 0 || nextCell >= totalCells || isBlocked(caseData, nextCell)) {
    return ["That tile cannot be occupied."];
  }
  if (nextCell !== from && !canMove(caseData, from, nextCell)) {
    errors.push(
      isAdjacent(from, nextCell, caseData.size)
        ? "A wall blocks that move. Change rooms through a marked door or gate."
        : "Continue one orthogonal tile at a time.",
    );
  }
  if (isSelfRevisit(path, nextCell)) errors.push("A timeline cannot return to a tile after leaving it. Use Wait to stay in place.");

  for (const event of person.evidence) {
    if (event.type === "point" && event.at === nextOffset && event.cell !== nextCell) {
      errors.push(`${event.title} fixes ${person.name} at another tile at ${formatCaseTime(caseData, nextOffset)}.`);
    }
    if (
      event.type === "edge" &&
      event.at === nextOffset &&
      edgeKey(from, nextCell) !== edgeKey(...event.cells)
    ) {
      errors.push(`${event.title} fixes the doorway crossed at ${formatCaseTime(caseData, nextOffset)}.`);
    }
  }

  if (errors.length === 0) {
    const candidate = [...path, nextCell];
    for (const event of person.evidence.filter((item) => item.type === "trace")) {
      if (nextOffset >= event.window[1] && !evidenceSatisfied(event, candidate)) {
        errors.push(`${event.title} must be reached by ${formatCaseTime(caseData, event.window[1])}.`);
      }
    }
  }

  return [...new Set(errors)];
}

export function validateTimeline(caseData, person, path, { requireComplete = true } = {}) {
  const errors = [];
  const totalCells = caseData.size ** 2;
  const expectedLength = caseData.timeline.endOffset + 1;
  const start = getStartEvidence(person);

  if (!Array.isArray(path) || path.length === 0) return { valid: false, errors: [`${person.name}'s timeline is empty.`] };
  if (start && path[0] !== start.cell) errors.push(`${person.name} does not begin at the first confirmed sighting.`);
  if (path.length > expectedLength) errors.push(`${person.name}'s timeline continues beyond the evidence window.`);
  if (requireComplete && path.length !== expectedLength) errors.push(`${person.name}'s timeline has not reached 21:22.`);

  const visited = new Set();
  for (let offset = 0; offset < path.length; offset += 1) {
    const cell = path[offset];
    if (!Number.isInteger(cell) || cell < 0 || cell >= totalCells) {
      errors.push(`${person.name}'s timeline leaves the floor plan.`);
      continue;
    }
    if (isBlocked(caseData, cell)) errors.push(`${person.name}'s timeline crosses blocked furniture.`);
    if (offset > 0) {
      const previous = path[offset - 1];
      if (cell !== previous && !canMove(caseData, previous, cell)) {
        errors.push(
          isAdjacent(previous, cell, caseData.size)
            ? `${person.name} crosses a wall without using a door.`
            : `${person.name}'s timeline contains a disconnected move.`,
        );
      }
      if (cell !== previous && visited.has(cell)) errors.push(`${person.name}'s timeline doubles back onto a tile.`);
    }
    visited.add(cell);
  }

  for (const event of person.evidence) {
    const state = getEvidenceState(event, path);
    if (state === "missed" || (requireComplete && state !== "satisfied")) {
      errors.push(`${person.name}'s timeline conflicts with ${event.title}.`);
    }
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function findTimedEncounters(caseData, paths) {
  const victim = getVictim(caseData);
  const victimPath = paths[victim.id] ?? [];
  const [attackStart, attackEnd] = caseData.forensics.attackWindow;
  const encounters = [];

  for (const person of caseData.people.filter((entry) => entry.role === "suspect")) {
    const path = paths[person.id] ?? [];
    const finalOffset = Math.min(path.length, victimPath.length) - 1;
    for (let offset = 0; offset <= finalOffset; offset += 1) {
      if (path[offset] !== victimPath[offset]) continue;
      encounters.push({
        suspectId: person.id,
        victimId: victim.id,
        cell: path[offset],
        offset,
        time: formatCaseTime(caseData, offset),
        inAttackWindow: offset >= attackStart && offset <= attackEnd
      });
    }
  }

  return encounters;
}

export function findKiller(caseData, paths) {
  const everyTimelineComplete = caseData.people.every((person) =>
    timelineComplete(caseData, person, paths[person.id] ?? []),
  );
  if (!everyTimelineComplete) return null;

  const matchingIds = new Set(
    findTimedEncounters(caseData, paths)
      .filter((encounter) => encounter.inAttackWindow)
      .map((encounter) => encounter.suspectId),
  );
  return matchingIds.size === 1 ? getPerson(caseData, [...matchingIds][0]) : null;
}

export function validateReconstruction(caseData, paths) {
  const errors = [];

  for (const person of caseData.people) {
    const result = validateTimeline(caseData, person, paths[person.id] ?? []);
    errors.push(...result.errors);
  }

  if (errors.length > 0) return { valid: false, errors: [...new Set(errors)], killer: null, encounter: null };

  const attackEncounters = findTimedEncounters(caseData, paths).filter((encounter) => encounter.inAttackWindow);
  const matchingIds = new Set(attackEncounters.map((encounter) => encounter.suspectId));
  if (matchingIds.size !== 1) {
    errors.push("The completed timelines do not produce exactly one timed encounter in the forensic window.");
  }
  const killer = errors.length === 0 ? getPerson(caseData, [...matchingIds][0]) : null;
  const encounter = killer ? attackEncounters.find((item) => item.suspectId === killer.id) : null;

  return { valid: errors.length === 0, errors: [...new Set(errors)], killer, encounter };
}

export function pathsEqual(left, right) {
  const ids = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...ids].every((id) => {
    const leftPath = left[id] ?? [];
    const rightPath = right[id] ?? [];
    return leftPath.length === rightPath.length && leftPath.every((cell, index) => cell === rightPath[index]);
  });
}
