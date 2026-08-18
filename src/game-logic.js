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

export function createInitialPaths(caseData) {
  return Object.fromEntries(caseData.suspects.map((suspect) => [suspect.id, [suspect.start]]));
}

export function getSuspect(caseData, suspectId) {
  return caseData.suspects.find((suspect) => suspect.id === suspectId);
}

export function getEndpointOwner(caseData, cell) {
  return caseData.suspects.find((suspect) => suspect.start === cell || suspect.end === cell)?.id ?? null;
}

export function getOccupancy(paths) {
  const occupancy = new Map();
  for (const [suspectId, path] of Object.entries(paths)) {
    for (const cell of path) occupancy.set(cell, suspectId);
  }
  return occupancy;
}

export function clueSatisfied(suspect, path) {
  const indices = (suspect.waypoints ?? []).map((cell) => path.indexOf(cell));
  if (indices.some((index) => index < 0)) return false;
  if (suspect.orderedWaypoints && !indices.every((index, position) => position === 0 || indices[position - 1] < index)) {
    return false;
  }
  if ((suspect.forbiddenCells ?? []).some((cell) => path.includes(cell))) return false;

  const traversedEdges = new Set(path.slice(1).map((cell, index) => edgeKey(path[index], cell)));
  return (suspect.requiredEdges ?? []).every(([from, to]) => traversedEdges.has(edgeKey(from, to)));
}

export function routeComplete(suspect, path) {
  return path.length === suspect.length && path.at(-1) === suspect.end && clueSatisfied(suspect, path);
}

export function findKiller(caseData, paths) {
  const matches = caseData.suspects.filter((suspect) => {
    const path = paths[suspect.id] ?? [];
    const weaponIndex = path.indexOf(caseData.evidence.weapon.cell);
    const victimIndex = path.indexOf(caseData.evidence.victim.cell);
    return weaponIndex >= 0 && victimIndex > weaponIndex;
  });
  return matches.length === 1 ? matches[0] : null;
}

export function validateBoard(caseData, paths) {
  const errors = [];
  const occupied = new Map();
  const totalCells = caseData.size * caseData.size;
  const walkableCells = getWalkableCells(caseData);
  const walkableSet = new Set(walkableCells);

  for (const suspect of caseData.suspects) {
    const path = paths[suspect.id] ?? [];
    if (path[0] !== suspect.start) errors.push(`${suspect.name} does not begin at the 21:10 sighting.`);
    if (path.length !== suspect.length) errors.push(`${suspect.name} needs ${suspect.length} trail tiles.`);
    if (path.at(-1) !== suspect.end) errors.push(`${suspect.name} has not reached the 21:25 sighting.`);
    if (!clueSatisfied(suspect, path)) errors.push(`${suspect.name} does not satisfy the evidence card.`);

    for (let index = 0; index < path.length; index += 1) {
      const cell = path[index];
      if (!Number.isInteger(cell) || cell < 0 || cell >= totalCells) {
        errors.push(`${suspect.name} leaves the floor plan.`);
        continue;
      }
      if (!walkableSet.has(cell)) errors.push(`${suspect.name} crosses blocked furniture.`);
      if (index > 0 && !canMove(caseData, path[index - 1], cell)) {
        errors.push(
          isAdjacent(path[index - 1], cell, caseData.size)
            ? `${suspect.name} crosses a wall without a door.`
            : `${suspect.name} contains a disconnected trail.`,
        );
      }
      if (occupied.has(cell)) errors.push(`Two trails occupy tile ${cell}.`);
      occupied.set(cell, suspect.id);
      const endpointOwner = getEndpointOwner(caseData, cell);
      if (endpointOwner && endpointOwner !== suspect.id) errors.push(`${suspect.name} crosses another sighting.`);
    }
  }

  const unassigned = walkableCells.filter((cell) => !occupied.has(cell));
  if (unassigned.length > 0) errors.push(`${unassigned.length} open floor tiles are still unassigned.`);
  const killer = findKiller(caseData, paths);
  if (!killer) errors.push("Exactly one route must reach the weapon before the victim.");

  return { valid: errors.length === 0, errors: [...new Set(errors)], killer };
}

export function pathsEqual(left, right) {
  const ids = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...ids].every((id) => {
    const leftPath = left[id] ?? [];
    const rightPath = right[id] ?? [];
    return leftPath.length === rightPath.length && leftPath.every((cell, index) => cell === rightPath[index]);
  });
}
