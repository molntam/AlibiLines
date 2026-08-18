import { hotelCase } from "./case.js";
import {
  edgeKey,
  evidenceProgress,
  formatCaseTime,
  getEvidenceState,
  getNextMoveErrors,
  getPerson,
  getRoomId,
  getStartEvidence,
  pathsEqual,
  timelineComplete,
  validateReconstruction,
  validateTimeline,
  createInitialPaths
} from "./game-logic.js";

const storageKey = `alibi-lines:${hotelCase.id}:paths`;
const solvedKey = `alibi-lines:${hotelCase.id}:solved`;
const svgNamespace = "http://www.w3.org/2000/svg";
const floorObjectIcons = {
  desk: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 13h28v15H6zM10 28v6m20-6v6M20 13v15M23 18h6"/></svg>',
  statue: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="10" r="5"/><path d="M13 28c1-8 3-13 7-13s6 5 7 13M9 29h22v5H9z"/></svg>',
  piano: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 9h24c3 0 4 2 3 5l-3 13H9zM11 27v7m17-7v7M10 18h22M15 18v9m5-9v9m5-9v9"/></svg>',
  fountain: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 7v12m-6-8c0 4 2 7 6 8 4-1 6-4 6-8M8 22h24c-1 7-5 11-12 11S9 29 8 22z"/></svg>'
};

const elements = {
  caseNumber: document.querySelector("#case-number"),
  caseTitle: document.querySelector("#case-title"),
  timeWindow: document.querySelector("#time-window"),
  difficulty: document.querySelector("#difficulty"),
  briefing: document.querySelector("#briefing-copy"),
  objective: document.querySelector("#objective-copy"),
  grid: document.querySelector("#game-grid"),
  cells: document.querySelector("#grid-cells"),
  routeLayer: document.querySelector("#route-layer"),
  selectedPersonName: document.querySelector("#selected-person-name"),
  currentTime: document.querySelector("#current-time"),
  completedCount: document.querySelector("#completed-count"),
  personList: document.querySelector("#person-list"),
  evidenceList: document.querySelector("#evidence-list"),
  evidencePerson: document.querySelector("#evidence-person"),
  feedbackKicker: document.querySelector("#feedback-kicker"),
  feedbackCopy: document.querySelector("#feedback-copy"),
  hintCopy: document.querySelector("#hint-copy"),
  cause: document.querySelector("#forensic-cause"),
  attackWindow: document.querySelector("#attack-window"),
  survival: document.querySelector("#survival-note"),
  finding: document.querySelector("#forensic-finding"),
  undoButton: document.querySelector("#undo-button"),
  clearButton: document.querySelector("#clear-button"),
  resetButton: document.querySelector("#reset-button"),
  waitButton: document.querySelector("#wait-button"),
  checkButton: document.querySelector("#check-button"),
  hintButton: document.querySelector("#hint-button"),
  rulesButton: document.querySelector("#rules-button"),
  rulesDialog: document.querySelector("#rules-dialog"),
  resultDialog: document.querySelector("#result-dialog"),
  resultTitle: document.querySelector("#result-title"),
  resultCopy: document.querySelector("#result-copy"),
  killerInitials: document.querySelector("#killer-initials"),
  killerName: document.querySelector("#killer-name"),
  encounterTime: document.querySelector("#encounter-time"),
  encounterRoom: document.querySelector("#encounter-room"),
  toast: document.querySelector("#toast")
};

const roomByCell = new Map();
const roomFirstCell = new Map();
for (const room of hotelCase.rooms) {
  roomFirstCell.set(room.id, Math.min(...room.cells));
  for (const cell of room.cells) roomByCell.set(cell, room);
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

let paths = loadPaths();
let selectedPersonId = hotelCase.people[0].id;
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
    const validShape = hotelCase.people.every((person) => {
      const path = stored?.[person.id];
      const start = getStartEvidence(person);
      return (
        Array.isArray(path) &&
        path[0] === start?.cell &&
        path.length <= hotelCase.timeline.endOffset + 1 &&
        validateTimeline(hotelCase, person, path, { requireComplete: false }).valid
      );
    });
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
  if (history.length > 120) history.shift();
  paths = nextPaths;
  solved = false;
  localStorage.removeItem(solvedKey);
  savePaths();
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

function evidenceTimeLabel(event) {
  if (event.type === "trace") {
    return `${formatCaseTime(hotelCase, event.window[0])}–${formatCaseTime(hotelCase, event.window[1])}`;
  }
  return formatCaseTime(hotelCase, event.at);
}

function selectedEvidenceByCell(person) {
  const map = new Map();
  for (const event of person.evidence.filter((item) => item.type !== "edge")) {
    const entries = map.get(event.cell) ?? [];
    entries.push(event);
    map.set(event.cell, entries);
  }
  return map;
}

function createEvidenceMarker(event, path) {
  const state = getEvidenceState(event, path);
  const marker = document.createElement("span");
  marker.className = `clue-pin clue-${event.type} is-${state}`;
  marker.title = `${event.title} — ${event.text}`;
  marker.innerHTML = `<b>${event.code}</b><small>${evidenceTimeLabel(event)}</small>`;
  return marker;
}

function renderGridCells() {
  const person = getPerson(hotelCase, selectedPersonId);
  const path = paths[selectedPersonId];
  elements.grid.style.setProperty("--selected-color", person.color);
  document.documentElement.style.setProperty("--selected-color", person.color);
  const evidenceByCell = selectedEvidenceByCell(person);
  const edgeEvidence = new Map(
    person.evidence
      .filter((event) => event.type === "edge")
      .map((event) => [edgeKey(...event.cells), event]),
  );

  elements.cells.innerHTML = "";
  for (let cell = 0; cell < hotelCase.size ** 2; cell += 1) {
    const room = roomByCell.get(cell);
    const floorObject = objectByCell.get(cell);
    const cellElement = document.createElement("div");
    cellElement.className = `cell ${roomEdgeClasses(cell)}${floorObject?.blocking ? " is-blocked" : ""}`;
    cellElement.dataset.cell = String(cell);
    cellElement.style.setProperty("--room-tone", room.tone);

    const content = document.createElement("div");
    content.className = "cell-content";

    if (roomFirstCell.get(room.id) === cell) {
      const label = document.createElement("span");
      label.className = "room-label";
      label.textContent = room.name;
      content.append(label);
    }

    for (const { passage, side } of passagesByCell.get(cell) ?? []) {
      const clue = edgeEvidence.get(edgeKey(...passage.cells));
      const marker = document.createElement("span");
      marker.className = `passage passage-${side} passage-${passage.type}${clue ? ` has-clue is-${getEvidenceState(clue, path)}` : ""}`;
      marker.title = clue ? `${passage.label}: ${clue.text}` : passage.label;
      if (passage.code) marker.innerHTML = `<b>${passage.code}</b>`;
      if (clue) {
        const tag = document.createElement("span");
        tag.className = "passage-clue-tag";
        tag.innerHTML = `<b>${clue.code}</b><small>${evidenceTimeLabel(clue)}</small>`;
        marker.append(tag);
      }
      content.append(marker);
    }

    if (floorObject) content.append(createFloorObjectMarker(floorObject));
    for (const event of evidenceByCell.get(cell) ?? []) content.append(createEvidenceMarker(event, path));

    cellElement.append(content);
    elements.cells.append(cellElement);
  }
}

function svgElement(name, attributes) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [attribute, value] of Object.entries(attributes)) element.setAttribute(attribute, String(value));
  return element;
}

function cellCoordinates(cell) {
  return [(cell % hotelCase.size) * 100 + 50, Math.floor(cell / hotelCase.size) * 100 + 50];
}

function cellPoint(cell) {
  return cellCoordinates(cell).join(",");
}

function renderRoutes() {
  elements.routeLayer.innerHTML = "";
  const ordered = [...hotelCase.people].sort((left, right) => {
    if (left.id === selectedPersonId) return 1;
    if (right.id === selectedPersonId) return -1;
    return 0;
  });

  for (const person of ordered) {
    const path = paths[person.id];
    if (path.length < 2) continue;
    const selected = person.id === selectedPersonId;
    const points = path.map(cellPoint).join(" ");
    elements.routeLayer.append(
      svgElement("polyline", { points, class: `trail-shadow${selected ? " selected" : ""}` }),
      svgElement("polyline", {
        points,
        class: `trail-line${selected ? " selected" : ""}`,
        stroke: person.color
      }),
    );

    if (selected) {
      path.forEach((cell, offset) => {
        const [cx, cy] = cellCoordinates(cell);
        if (offset > 0 && path[offset - 1] === cell) {
          elements.routeLayer.append(
            svgElement("circle", { cx, cy, r: 14 + offset, class: "wait-ring", stroke: person.color }),
          );
        } else {
          elements.routeLayer.append(svgElement("circle", { cx, cy, r: 4.5, class: "minute-node", fill: person.color }));
        }
      });
    }

    const [cx, cy] = cellCoordinates(path.at(-1));
    elements.routeLayer.append(
      svgElement("circle", {
        cx,
        cy,
        r: selected ? 13 : 8,
        class: `trail-tail${selected ? " selected" : ""}`,
        fill: person.color
      }),
    );
  }
}

function renderPeople() {
  elements.personList.innerHTML = "";
  let completeCount = 0;

  for (const person of hotelCase.people) {
    const path = paths[person.id];
    const progress = evidenceProgress(person, path);
    const complete = timelineComplete(hotelCase, person, path);
    if (complete) completeCount += 1;

    const card = document.createElement("button");
    card.type = "button";
    card.className = `person-card${person.id === selectedPersonId ? " selected" : ""}${person.role === "victim" ? " victim-card" : ""}`;
    card.style.setProperty("--person-color", person.color);
    card.setAttribute("aria-pressed", String(person.id === selectedPersonId));
    card.innerHTML = `
      <span class="person-avatar">${person.initials}</span>
      <span class="person-copy">
        <span class="person-role">${person.role === "victim" ? "Victim timeline" : "Suspect"}</span>
        <strong>${person.name}</strong>
        <small>${progress.satisfied} of ${progress.total} records aligned</small>
      </span>
      <span class="timeline-state${complete ? " complete" : progress.missed ? " conflict" : ""}">
        <b>${complete ? "Verified" : formatCaseTime(hotelCase, path.length - 1)}</b>
        <small>${complete ? "Timeline" : "Current time"}</small>
      </span>
    `;
    card.addEventListener("click", () => {
      selectedPersonId = person.id;
      render();
      elements.grid.focus({ preventScroll: true });
    });
    elements.personList.append(card);
  }

  elements.completedCount.textContent = `${completeCount} / ${hotelCase.people.length} verified`;
}

function renderEvidenceList() {
  const person = getPerson(hotelCase, selectedPersonId);
  const path = paths[selectedPersonId];
  elements.evidencePerson.textContent = person.name;
  elements.evidenceList.innerHTML = "";

  for (const event of person.evidence) {
    const state = getEvidenceState(event, path);
    const item = document.createElement("li");
    item.className = `evidence-record is-${state}`;
    item.innerHTML = `
      <span class="record-code">${event.code}</span>
      <span>
        <small>${evidenceTimeLabel(event)} · ${event.type === "trace" ? "Physical trace" : event.type === "edge" ? "Access record" : "Timed sighting"}</small>
        <strong>${event.title}</strong>
        <p>${event.text}</p>
      </span>
      <i aria-label="${state}"></i>
    `;
    elements.evidenceList.append(item);
  }
}

function renderProgress() {
  const person = getPerson(hotelCase, selectedPersonId);
  const path = paths[selectedPersonId];
  const currentOffset = path.length - 1;
  const complete = timelineComplete(hotelCase, person, path);
  const completeCount = hotelCase.people.filter((entry) => timelineComplete(hotelCase, entry, paths[entry.id])).length;

  elements.selectedPersonName.textContent = person.name;
  elements.currentTime.textContent = formatCaseTime(hotelCase, currentOffset);
  elements.undoButton.disabled = history.length === 0;
  elements.waitButton.disabled = path.length >= hotelCase.timeline.endOffset + 1;
  elements.clearButton.disabled = path.length <= 1;
  elements.checkButton.textContent = completeCount === hotelCase.people.length ? "Reveal deduction" : "Verify reconstruction";

  if (solved) {
    setFeedback("Case closed", "The six timelines are locked. Select any person to review how the deduction was made.");
  } else if (complete) {
    setFeedback("Timeline verified", `${person.name}'s evidence is internally consistent. Continue with another timeline.`);
  } else {
    const progress = evidenceProgress(person, path);
    setFeedback(
      `${person.name} · ${formatCaseTime(hotelCase, currentOffset)}`,
      `${progress.satisfied} of ${progress.total} records align. Draw to an adjacent tile, or wait one minute in place.`,
    );
  }
}

function render() {
  renderGridCells();
  renderRoutes();
  renderPeople();
  renderEvidenceList();
  renderProgress();
}

function truncateToCell(cell) {
  const path = paths[selectedPersonId];
  const index = path.lastIndexOf(cell);
  if (index < 0 || index === path.length - 1) return false;
  const nextPaths = clonePaths();
  nextPaths[selectedPersonId] = path.slice(0, index + 1);
  return commit(nextPaths);
}

function applyMove(cell, { wait = false } = {}) {
  const person = getPerson(hotelCase, selectedPersonId);
  const path = paths[selectedPersonId];

  if (!wait && path.includes(cell)) return truncateToCell(cell);
  if (!wait && cell === path.at(-1)) {
    showToast("Use Wait 1 min to remain on this tile.");
    return false;
  }

  const nextCell = wait ? path.at(-1) : cell;
  const errors = getNextMoveErrors(hotelCase, person, path, nextCell);
  if (errors.length > 0) {
    setFeedback("Timeline conflict", errors[0]);
    showToast(errors[0]);
    return false;
  }

  const nextPaths = clonePaths();
  nextPaths[selectedPersonId] = [...path, nextCell];
  return commit(nextPaths);
}

function cellFromEvent(event) {
  const cellElement = event.target.closest?.(".cell");
  return cellElement ? Number(cellElement.dataset.cell) : null;
}

function beginDrawing(event) {
  const cell = cellFromEvent(event);
  if (cell === null || objectByCell.get(cell)?.blocking) return;
  event.preventDefault();
  dragging = true;
  lastPointerCell = cell;
  elements.grid.setPointerCapture?.(event.pointerId);
  applyMove(cell);
}

function continueDrawing(event) {
  if (!dragging) return;
  const cell = cellFromEvent(event);
  if (cell === null || cell === lastPointerCell || objectByCell.get(cell)?.blocking) return;
  lastPointerCell = cell;
  applyMove(cell);
}

function stopDrawing() {
  dragging = false;
  lastPointerCell = null;
}

function undo() {
  const previous = history.pop();
  if (!previous) return;
  paths = previous;
  solved = false;
  localStorage.removeItem(solvedKey);
  savePaths();
  render();
}

function clearSelectedTimeline() {
  const person = getPerson(hotelCase, selectedPersonId);
  const start = getStartEvidence(person);
  const nextPaths = clonePaths();
  nextPaths[selectedPersonId] = [start.cell];
  commit(nextPaths);
}

function resetCase() {
  if (!window.confirm("Reset every reconstructed timeline in this case?")) return;
  history.push(clonePaths());
  paths = createInitialPaths(hotelCase);
  solved = false;
  localStorage.removeItem(solvedKey);
  savePaths();
  render();
  showToast("All timelines reset.");
}

function checkReconstruction() {
  const result = validateReconstruction(hotelCase, paths);
  if (!result.valid) {
    const incomplete = hotelCase.people.find((person) => !timelineComplete(hotelCase, person, paths[person.id]));
    if (incomplete) selectedPersonId = incomplete.id;
    render();
    const completeCount = hotelCase.people.filter((person) => timelineComplete(hotelCase, person, paths[person.id])).length;
    const message = incomplete
      ? `${completeCount} of 6 timelines are verified. ${result.errors[0]}`
      : result.errors[0];
    setFeedback("Reconstruction incomplete", message);
    showToast("The deduction stays sealed until all six timelines verify.");
    return;
  }

  solved = true;
  localStorage.setItem(solvedKey, "true");
  const room = hotelCase.rooms.find((entry) => entry.id === getRoomId(hotelCase, result.encounter.cell));
  elements.killerInitials.textContent = result.killer.initials;
  elements.resultDialog.style.setProperty("--killer-color", result.killer.color);
  elements.killerName.textContent = result.killer.name;
  elements.resultTitle.textContent = "The minute tells the truth.";
  elements.resultCopy.textContent = `${result.killer.name} and Adrian occupied the same ${room?.name ?? "hotel"} tile at ${result.encounter.time}. Every other suspect crossed Adrian's route at a different minute.`;
  elements.encounterTime.textContent = result.encounter.time;
  elements.encounterRoom.textContent = room?.name ?? "Floor plan";
  render();
  elements.resultDialog.showModal();
}

function revealHint() {
  elements.hintCopy.textContent = hotelCase.hints[hintIndex % hotelCase.hints.length];
  hintIndex += 1;
}

function handleGridKeydown(event) {
  const movement = {
    ArrowUp: -hotelCase.size,
    ArrowRight: 1,
    ArrowDown: hotelCase.size,
    ArrowLeft: -1
  };
  if (event.key.toLowerCase() === "w" || event.key === " ") {
    event.preventDefault();
    applyMove(paths[selectedPersonId].at(-1), { wait: true });
    return;
  }
  if (!(event.key in movement)) return;
  event.preventDefault();
  applyMove(paths[selectedPersonId].at(-1) + movement[event.key]);
}

function initialiseCaseFile() {
  elements.caseNumber.textContent = hotelCase.number;
  elements.caseTitle.textContent = hotelCase.title;
  elements.timeWindow.textContent = hotelCase.timeline.label;
  elements.difficulty.textContent = hotelCase.difficulty;
  elements.briefing.textContent = hotelCase.briefing;
  elements.objective.textContent = hotelCase.objective;
  elements.cause.textContent = hotelCase.forensics.cause;
  elements.attackWindow.textContent = hotelCase.forensics.attackWindowLabel;
  elements.survival.textContent = hotelCase.forensics.survival;
  elements.finding.textContent = hotelCase.forensics.finding;
  elements.hintCopy.textContent = "Hints explain a deduction without revealing a complete route.";
}

elements.grid.addEventListener("pointerdown", beginDrawing);
elements.grid.addEventListener("pointerover", continueDrawing);
elements.grid.addEventListener("pointerup", stopDrawing);
elements.grid.addEventListener("pointercancel", stopDrawing);
elements.grid.addEventListener("lostpointercapture", stopDrawing);
elements.grid.addEventListener("keydown", handleGridKeydown);
elements.undoButton.addEventListener("click", undo);
elements.clearButton.addEventListener("click", clearSelectedTimeline);
elements.resetButton.addEventListener("click", resetCase);
elements.waitButton.addEventListener("click", () => applyMove(paths[selectedPersonId].at(-1), { wait: true }));
elements.checkButton.addEventListener("click", checkReconstruction);
elements.hintButton.addEventListener("click", revealHint);
elements.rulesButton.addEventListener("click", () => elements.rulesDialog.showModal());

for (const button of document.querySelectorAll("[data-close-dialog]")) {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`)?.close());
}
for (const dialog of document.querySelectorAll("dialog")) {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

initialiseCaseFile();
render();
