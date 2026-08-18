import { hotelCase } from "./case.js";
import {
  canMove,
  clueSatisfied,
  createInitialPaths,
  getBlockingObject,
  getEndpointOwner,
  getOccupancy,
  getSuspect,
  getWalkableCells,
  isAdjacent,
  pathsEqual,
  routeComplete,
  validateBoard
} from "./game-logic.js";

const storageKey = `alibi-lines:${hotelCase.id}:paths`;
const solvedKey = `alibi-lines:${hotelCase.id}:solved`;
const svgNamespace = "http://www.w3.org/2000/svg";
const floorObjectIcons = {
  desk: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 13h28v15H6zM10 28v6m20-6v6M20 13v15M23 18h6"/></svg>',
  statue: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="10" r="5"/><path d="M13 28c1-8 3-13 7-13s6 5 7 13M9 29h22v5H9z"/></svg>',
  piano: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 9h24c3 0 4 2 3 5l-3 13H9zM11 27v7m17-7v7M10 18h22M15 18v9m5-9v9m5-9v9"/></svg>',
  fountain: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 7v12m-6-8c0 4 2 7 6 8 4-1 6-4 6-8M8 22h24c-1 7-5 11-12 11S9 29 8 22z"/></svg>',
  weapon: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M29 7 16 24m-4-2 7 6m-10 4 8-8m9-14 4-3-1 5"/></svg>',
  victim: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="9" r="4"/><path d="M20 13v10m0-5-8 5m8-5 8 5m-8 0-6 10m6-10 6 10"/></svg>'
};

const elements = {
  caseNumber: document.querySelector("#case-number"),
  caseTitle: document.querySelector("#case-title"),
  timeWindow: document.querySelector("#time-window"),
  difficulty: document.querySelector("#difficulty"),
  briefing: document.querySelector("#briefing-copy"),
  objective: document.querySelector("#objective-copy"),
  victimName: document.querySelector("#victim-name"),
  grid: document.querySelector("#game-grid"),
  cells: document.querySelector("#grid-cells"),
  routeLayer: document.querySelector("#route-layer"),
  coveredCount: document.querySelector("#covered-count"),
  tileCount: document.querySelector("#tile-count"),
  completedCount: document.querySelector("#completed-count"),
  suspectList: document.querySelector("#suspect-list"),
  feedbackKicker: document.querySelector("#feedback-kicker"),
  feedbackCopy: document.querySelector("#feedback-copy"),
  hintCopy: document.querySelector("#hint-copy"),
  undoButton: document.querySelector("#undo-button"),
  clearButton: document.querySelector("#clear-button"),
  resetButton: document.querySelector("#reset-button"),
  checkButton: document.querySelector("#check-button"),
  hintButton: document.querySelector("#hint-button"),
  rulesButton: document.querySelector("#rules-button"),
  rulesDialog: document.querySelector("#rules-dialog"),
  resultDialog: document.querySelector("#result-dialog"),
  resultTitle: document.querySelector("#result-title"),
  resultCopy: document.querySelector("#result-copy"),
  killerInitials: document.querySelector("#killer-initials"),
  killerName: document.querySelector("#killer-name"),
  toast: document.querySelector("#toast")
};

const roomByCell = new Map();
const roomFirstCell = new Map();
for (const room of hotelCase.rooms) {
  roomFirstCell.set(room.id, Math.min(...room.cells));
  for (const cell of room.cells) roomByCell.set(cell, room);
}

const markersByCell = new Map();
for (const suspect of hotelCase.suspects) {
  for (const marker of suspect.markers ?? []) {
    const markers = markersByCell.get(marker.cell) ?? [];
    markers.push(marker);
    markersByCell.set(marker.cell, markers);
  }
}

const objectByCell = new Map(hotelCase.objects.map((object) => [object.cell, object]));
const passagesByCell = new Map();
for (const passage of hotelCase.passages) {
  const [first, second] = passage.cells;
  const horizontal = Math.floor(first / hotelCase.size) === Math.floor(second / hotelCase.size);
  const anchor = Math.min(first, second);
  const passages = passagesByCell.get(anchor) ?? [];
  passages.push({ passage, side: horizontal ? "right" : "bottom" });
  passagesByCell.set(anchor, passages);
}
const walkableCount = getWalkableCells(hotelCase).length;

let paths = loadPaths();
let selectedSuspectId = hotelCase.suspects[0].id;
let history = [];
let hintIndex = 0;
let dragging = false;
let lastPointerCell = null;
let solved = localStorage.getItem(solvedKey) === "true" && pathsEqual(paths, hotelCase.solution);
let toastTimer = null;

function clonePaths(value = paths) {
  return Object.fromEntries(Object.entries(value).map(([id, path]) => [id, [...path]]));
}

function loadPaths() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    const validShape = hotelCase.suspects.every(
      (suspect) => Array.isArray(stored?.[suspect.id]) && stored[suspect.id][0] === suspect.start,
    );
    if (validShape) return stored;
  } catch {
    localStorage.removeItem(storageKey);
  }
  return createInitialPaths(hotelCase);
}

function savePaths() {
  localStorage.setItem(storageKey, JSON.stringify(paths));
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2800);
}

function setFeedback(kicker, copy) {
  elements.feedbackKicker.textContent = kicker;
  elements.feedbackCopy.textContent = copy;
}

function commit(nextPaths) {
  if (pathsEqual(paths, nextPaths)) return false;
  history.push(clonePaths());
  if (history.length > 100) history.shift();
  paths = nextPaths;
  solved = false;
  localStorage.removeItem(solvedKey);
  render();
  return true;
}

function roomEdgeClasses(cell) {
  const row = Math.floor(cell / hotelCase.size);
  const col = cell % hotelCase.size;
  const room = roomByCell.get(cell)?.id;
  const classes = [];
  const comparisons = [
    ["top", row === 0 ? null : cell - hotelCase.size],
    ["right", col === hotelCase.size - 1 ? null : cell + 1],
    ["bottom", row === hotelCase.size - 1 ? null : cell + hotelCase.size],
    ["left", col === 0 ? null : cell - 1]
  ];
  for (const [edge, neighbor] of comparisons) {
    if (neighbor === null || roomByCell.get(neighbor)?.id !== room) classes.push(`room-edge-${edge}`);
  }
  return classes.join(" ");
}

function createFloorObjectMarker(object) {
  const marker = document.createElement("span");
  marker.className = `floor-object object-${object.type}`;
  marker.title = `${object.label} — blocked`;
  marker.innerHTML = `${floorObjectIcons[object.type]}<small>${object.shortLabel}</small>`;
  return marker;
}

function createSceneMarker(evidence) {
  const marker = document.createElement("span");
  marker.className = `scene-object ${evidence.type}`;
  marker.title = evidence.label;
  marker.innerHTML = `${floorObjectIcons[evidence.type]}<small>${evidence.shortLabel}</small>`;
  return marker;
}

function renderGridCells() {
  const occupancy = getOccupancy(paths);
  const endpointByCell = new Map();
  for (const suspect of hotelCase.suspects) {
    endpointByCell.set(suspect.start, { suspect, type: "start" });
    endpointByCell.set(suspect.end, { suspect, type: "end" });
  }

  elements.cells.innerHTML = "";
  for (let cell = 0; cell < hotelCase.size ** 2; cell += 1) {
    const room = roomByCell.get(cell);
    const floorObject = objectByCell.get(cell);
    const ownerId = occupancy.get(cell);
    const owner = ownerId ? getSuspect(hotelCase, ownerId) : null;
    const cellElement = document.createElement("div");
    cellElement.className = `cell ${roomEdgeClasses(cell)}${owner ? " is-used" : ""}${floorObject?.blocking ? " is-blocked" : ""}`;
    cellElement.dataset.cell = String(cell);
    cellElement.style.setProperty("--room-tone", room.tone);
    if (owner) cellElement.style.setProperty("--trail-color", owner.color);

    const content = document.createElement("div");
    content.className = "cell-content";

    if (roomFirstCell.get(room.id) === cell) {
      const label = document.createElement("span");
      label.className = "room-label";
      label.textContent = room.name;
      content.append(label);
    }

    for (const { passage, side } of passagesByCell.get(cell) ?? []) {
      const marker = document.createElement("span");
      marker.className = `passage passage-${side} passage-${passage.type}`;
      marker.title = passage.label;
      if (passage.code) marker.innerHTML = `<b>${passage.code}</b>`;
      content.append(marker);
    }

    if (floorObject) content.append(createFloorObjectMarker(floorObject));

    const endpoint = endpointByCell.get(cell);
    if (endpoint) {
      const isSelected = endpoint.suspect.id === selectedSuspectId;
      const isStart = endpoint.type === "start";
      const marker = document.createElement("span");
      marker.className = `endpoint ${endpoint.type}${isSelected ? " is-selected" : ""}`;
      marker.style.setProperty("--suspect-color", endpoint.suspect.color);
      marker.dataset.step = isStart ? "S" : "E";
      marker.textContent = endpoint.suspect.initials;
      marker.title = `${endpoint.suspect.name} — ${isStart ? "start at 21:10" : "end at 21:25"}`;
      marker.setAttribute("aria-label", marker.title);

      if (isSelected) {
        const col = cell % hotelCase.size;
        const otherCell = isStart ? endpoint.suspect.end : endpoint.suspect.start;
        const otherCol = otherCell % hotelCase.size;
        const sameRow = Math.floor(cell / hotelCase.size) === Math.floor(otherCell / hotelCase.size);
        if (sameRow && Math.abs(col - otherCol) === 1) {
          marker.classList.add(isStart ? "callout-up" : "callout-down");
        } else {
          marker.classList.add(col >= hotelCase.size - 2 ? "callout-left" : "callout-right");
        }
        const callout = document.createElement("span");
        callout.className = "endpoint-callout";
        callout.setAttribute("aria-hidden", "true");
        callout.innerHTML = `<strong>${isStart ? "Start" : "End"}</strong><small>${isStart ? "21:10" : "21:25"}</small>`;
        marker.append(callout);
        cellElement.classList.add("has-selected-endpoint");
      }

      content.append(marker);
    }

    for (const markerData of markersByCell.get(cell) ?? []) {
      const marker = document.createElement("span");
      marker.className = "evidence-marker";
      marker.textContent = markerData.shortLabel;
      marker.title = markerData.label;
      content.append(marker);
    }

    if (cell === hotelCase.evidence.weapon.cell) content.append(createSceneMarker(hotelCase.evidence.weapon));
    if (cell === hotelCase.evidence.victim.cell) content.append(createSceneMarker(hotelCase.evidence.victim));

    cellElement.append(content);
    elements.cells.append(cellElement);
  }
}

function svgElement(name, attributes) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [attribute, value] of Object.entries(attributes)) element.setAttribute(attribute, String(value));
  return element;
}

function cellPoint(cell) {
  return `${(cell % hotelCase.size) * 100 + 50},${Math.floor(cell / hotelCase.size) * 100 + 50}`;
}

function renderRoutes() {
  elements.routeLayer.innerHTML = "";
  const ordered = [...hotelCase.suspects].sort((left, right) => {
    if (left.id === selectedSuspectId) return 1;
    if (right.id === selectedSuspectId) return -1;
    return 0;
  });

  for (const suspect of ordered) {
    const path = paths[suspect.id];
    if (path.length < 2) continue;
    const points = path.map(cellPoint).join(" ");
    elements.routeLayer.append(
      svgElement("polyline", { points, class: "trail-shadow" }),
      svgElement("polyline", {
        points,
        class: `trail-line${suspect.id === selectedSuspectId ? " selected" : ""}`,
        stroke: suspect.color
      }),
    );
    const tail = path.at(-1);
    if (tail !== suspect.end) {
      const [cx, cy] = cellPoint(tail).split(",");
      elements.routeLayer.append(
        svgElement("circle", { cx, cy, r: 10, fill: suspect.color, class: "trail-node" }),
      );
    }
  }
}

function renderSuspects() {
  elements.suspectList.innerHTML = "";
  let completeCount = 0;

  for (const suspect of hotelCase.suspects) {
    const path = paths[suspect.id];
    const clueIsSatisfied = clueSatisfied(suspect, path);
    const complete = routeComplete(suspect, path);
    if (complete) completeCount += 1;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `suspect-card${suspect.id === selectedSuspectId ? " selected" : ""}`;
    card.style.setProperty("--suspect-color", suspect.color);
    card.setAttribute("aria-pressed", String(suspect.id === selectedSuspectId));
    card.innerHTML = `
      <span class="suspect-avatar">${suspect.initials}</span>
      <span class="suspect-copy">
        <span class="suspect-name-row">
          <strong>${suspect.name}</strong>
          <i class="clue-state${clueIsSatisfied ? " satisfied" : ""}" aria-label="${clueIsSatisfied ? "Evidence satisfied" : "Evidence not yet satisfied"}"></i>
        </span>
        <p>${suspect.clue}</p>
        <span class="suspect-timeline" aria-label="Start at 21:10 and end at 21:25">
          <span><i class="timeline-start"></i>Start 21:10</span>
          <b aria-hidden="true">→</b>
          <span><i class="timeline-end"></i>End 21:25</span>
        </span>
      </span>
      <span class="route-meter${complete ? " complete" : ""}">
        <strong>${path.length} / ${suspect.length}</strong>
        <span>${complete ? "Complete" : "Tiles"}</span>
      </span>
    `;
    card.addEventListener("click", () => {
      selectedSuspectId = suspect.id;
      render();
      elements.grid.focus({ preventScroll: true });
    });
    elements.suspectList.append(card);
  }

  elements.completedCount.textContent = `${completeCount} / ${hotelCase.suspects.length} complete`;
}

function renderProgress() {
  const occupancy = getOccupancy(paths);
  elements.coveredCount.textContent = String(occupancy.size);
  elements.tileCount.textContent = String(walkableCount);
  elements.undoButton.disabled = history.length === 0;

  const suspect = getSuspect(hotelCase, selectedSuspectId);
  const path = paths[selectedSuspectId];
  if (solved) {
    setFeedback("Case closed", "Every trace is accounted for. Select a suspect to review the reconstructed route.");
  } else if (path.at(-1) === suspect.end && path.length < suspect.length) {
    setFeedback("Route too short", `${suspect.name} reached END 21:25 too early. The trail needs ${suspect.length} tiles.`);
  } else if (path.length === suspect.length && path.at(-1) !== suspect.end) {
    setFeedback("Wrong final tile", `${suspect.name} must finish on the outlined END 21:25 sighting marker.`);
  } else {
    setFeedback(
      "Selected trail",
      `${suspect.name}: filled START 21:10 → outlined END 21:25 · ${path.length} of ${suspect.length} tiles assigned.`,
    );
  }
}

function render() {
  renderGridCells();
  renderRoutes();
  renderSuspects();
  renderProgress();
  savePaths();
}

function applyCell(cell, quiet = false) {
  const suspect = getSuspect(hotelCase, selectedSuspectId);
  const currentPath = paths[selectedSuspectId];
  const existingIndex = currentPath.indexOf(cell);

  if (existingIndex >= 0) {
    if (existingIndex === currentPath.length - 1) return false;
    const nextPaths = clonePaths();
    nextPaths[selectedSuspectId] = currentPath.slice(0, existingIndex + 1);
    return commit(nextPaths);
  }

  const tail = currentPath.at(-1);
  if (!isAdjacent(tail, cell, hotelCase.size)) {
    if (!quiet) showToast("Continue from the end of the selected trail, one tile at a time.");
    return false;
  }

  if (!canMove(hotelCase, tail, cell)) {
    const blockingObject = getBlockingObject(hotelCase, cell);
    const kicker = blockingObject ? "Blocked tile" : "Solid wall";
    const message = blockingObject
      ? `${blockingObject.label} occupies that floor tile.`
      : "You can change rooms only through a marked door, gate or hatch.";
    setFeedback(kicker, message);
    if (!quiet) showToast(message);
    return false;
  }

  const endpointOwner = getEndpointOwner(hotelCase, cell);
  if (endpointOwner && endpointOwner !== suspect.id) {
    if (!quiet) showToast("That tile is another suspect’s confirmed sighting.");
    return false;
  }

  const occupancy = getOccupancy(paths);
  const occupiedBy = occupancy.get(cell);
  if (occupiedBy && occupiedBy !== suspect.id) {
    if (!quiet) showToast(`That trace already belongs to ${getSuspect(hotelCase, occupiedBy).name}.`);
    return false;
  }

  if (tail === suspect.end || currentPath.length >= suspect.length) {
    if (!quiet) showToast(`${suspect.name} has no trail tiles remaining.`);
    return false;
  }

  const nextLength = currentPath.length + 1;
  if (cell === suspect.end && nextLength !== suspect.length) {
    if (!quiet) showToast(`The outlined sighting must be tile ${suspect.length} of ${suspect.name}’s route.`);
    return false;
  }

  if (nextLength === suspect.length && cell !== suspect.end) {
    if (!quiet) showToast(`${suspect.name}’s final tile must be the outlined sighting marker.`);
    return false;
  }

  const nextPaths = clonePaths();
  nextPaths[selectedSuspectId] = [...currentPath, cell];
  return commit(nextPaths);
}

function cellFromPointer(event) {
  const bounds = elements.grid.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - bounds.left, 0), bounds.width - 0.01);
  const y = Math.min(Math.max(event.clientY - bounds.top, 0), bounds.height - 0.01);
  const col = Math.floor((x / bounds.width) * hotelCase.size);
  const row = Math.floor((y / bounds.height) * hotelCase.size);
  return row * hotelCase.size + col;
}

function selectEndpoint(cell) {
  const ownerId = getEndpointOwner(hotelCase, cell);
  if (!ownerId) return false;
  selectedSuspectId = ownerId;
  render();
  return true;
}

elements.grid.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 && event.pointerType === "mouse") return;
  event.preventDefault();
  elements.grid.focus({ preventScroll: true });
  const cell = cellFromPointer(event);
  const ownerId = getEndpointOwner(hotelCase, cell);
  if (ownerId && ownerId !== selectedSuspectId) selectEndpoint(cell);
  const selectedPath = paths[selectedSuspectId];
  if (!ownerId || cell === selectedPath.at(-1) || cell === getSuspect(hotelCase, selectedSuspectId).end) {
    applyCell(cell, true);
  }
  dragging = true;
  lastPointerCell = cell;
  elements.grid.setPointerCapture?.(event.pointerId);
});

elements.grid.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  event.preventDefault();
  const cell = cellFromPointer(event);
  if (cell === lastPointerCell) return;
  lastPointerCell = cell;
  applyCell(cell, true);
});

function stopDragging() {
  dragging = false;
  lastPointerCell = null;
}

elements.grid.addEventListener("pointerup", stopDragging);
elements.grid.addEventListener("pointercancel", stopDragging);
elements.grid.addEventListener("lostpointercapture", stopDragging);

elements.grid.addEventListener("keydown", (event) => {
  const path = paths[selectedSuspectId];
  const tail = path.at(-1);
  const row = Math.floor(tail / hotelCase.size);
  const col = tail % hotelCase.size;
  const targets = {
    ArrowUp: row > 0 ? tail - hotelCase.size : null,
    ArrowRight: col < hotelCase.size - 1 ? tail + 1 : null,
    ArrowDown: row < hotelCase.size - 1 ? tail + hotelCase.size : null,
    ArrowLeft: col > 0 ? tail - 1 : null
  };

  if (event.key in targets) {
    event.preventDefault();
    if (targets[event.key] !== null) applyCell(targets[event.key]);
  }

  if ((event.key === "Backspace" || event.key === "Delete") && path.length > 1) {
    event.preventDefault();
    const nextPaths = clonePaths();
    nextPaths[selectedSuspectId] = path.slice(0, -1);
    commit(nextPaths);
  }
});

elements.undoButton.addEventListener("click", () => {
  if (history.length === 0) return;
  paths = history.pop();
  solved = false;
  localStorage.removeItem(solvedKey);
  render();
});

elements.clearButton.addEventListener("click", () => {
  const suspect = getSuspect(hotelCase, selectedSuspectId);
  const nextPaths = clonePaths();
  nextPaths[selectedSuspectId] = [suspect.start];
  if (commit(nextPaths)) showToast(`${suspect.name}’s trail was cleared.`);
});

elements.resetButton.addEventListener("click", () => {
  if (!window.confirm("Reset every reconstructed trail in this case?")) return;
  history.push(clonePaths());
  paths = createInitialPaths(hotelCase);
  solved = false;
  hintIndex = 0;
  elements.hintCopy.textContent = "Hints explain a deduction without filling the route for you.";
  localStorage.removeItem(solvedKey);
  render();
});

elements.hintButton.addEventListener("click", () => {
  const hint = hotelCase.hints[hintIndex % hotelCase.hints.length];
  hintIndex += 1;
  elements.hintCopy.textContent = hint;
  elements.hintButton.textContent = hintIndex >= hotelCase.hints.length ? "Review hints" : "Next hint";
});

elements.checkButton.addEventListener("click", () => {
  const result = validateBoard(hotelCase, paths);
  if (!result.valid) {
    const incomplete = hotelCase.suspects.find((suspect) => !routeComplete(suspect, paths[suspect.id]));
    if (incomplete) selectedSuspectId = incomplete.id;
    render();
    const remaining = walkableCount - getOccupancy(paths).size;
    showToast(remaining > 0 ? `${remaining} open floor tiles are still unassigned.` : result.errors[0]);
    return;
  }

  if (!pathsEqual(paths, hotelCase.solution)) {
    showToast("These routes satisfy the visible evidence but do not match the verified case solution.");
    return;
  }

  solved = true;
  localStorage.setItem(solvedKey, "true");
  selectedSuspectId = result.killer.id;
  render();
  showResult(result.killer);
});

function showResult(killer) {
  elements.resultDialog.style.setProperty("--killer-color", killer.color);
  elements.killerInitials.textContent = killer.initials;
  elements.killerName.textContent = killer.name;
  elements.resultCopy.textContent = `${killer.name} took the letter opener from the service wing, crossed staff hatch H and reached ${hotelCase.victimName} in the Grand Hall before the cameras returned.`;
  elements.resultDialog.showModal();
}

elements.rulesButton.addEventListener("click", () => elements.rulesDialog.showModal());
elements.rulesDialog.addEventListener("close", () => localStorage.setItem("alibi-lines:rules-seen", "true"));
for (const button of document.querySelectorAll("[data-close-dialog]")) {
  button.addEventListener("click", () => {
    const dialog = document.querySelector(`#${button.dataset.closeDialog}`);
    dialog.close();
    if (dialog === elements.rulesDialog) localStorage.setItem("alibi-lines:rules-seen", "true");
  });
}

for (const dialog of document.querySelectorAll("dialog")) {
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) dialog.close();
  });
}

elements.caseNumber.textContent = hotelCase.number;
elements.caseTitle.textContent = hotelCase.title;
elements.timeWindow.textContent = hotelCase.timeWindow;
elements.difficulty.textContent = hotelCase.difficulty;
elements.briefing.textContent = hotelCase.briefing;
elements.objective.textContent = hotelCase.objective;
elements.victimName.textContent = hotelCase.victimName;
elements.grid.tabIndex = 0;

render();

if (localStorage.getItem("alibi-lines:rules-seen") !== "true") {
  window.setTimeout(() => elements.rulesDialog.showModal(), 250);
}
