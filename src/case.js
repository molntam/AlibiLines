export const hotelCase = {
  id: "blackthorn-hotel-v2",
  number: "001",
  title: "Blackthorn Hotel",
  size: 7,
  difficulty: "Intermediate",
  timeWindow: "21:10–21:25",
  victimName: "Adrian Vale",
  briefing:
    "The hotel cameras failed for fifteen minutes. Five guests were recorded immediately before and after the blackout. A letter opener vanished from the service wing, and Adrian Vale was found in the Grand Hall.",
  objective:
    "Reconstruct every trail across the 45 open tiles. Walls, doors and fixed furniture determine where each suspect could move.",
  rooms: [
    { id: "north-gallery", name: "North Gallery", tone: "#e8e1d2", cells: [0, 1, 2, 3, 4, 5, 6] },
    { id: "lobby", name: "Lobby", tone: "#dedaca", cells: [7, 8, 9, 14, 15, 16] },
    { id: "east-wing", name: "East Wing", tone: "#e5d7cd", cells: [10, 11, 12, 13, 17, 18, 19, 20] },
    { id: "lounge", name: "Lounge", tone: "#d9ddcf", cells: [21, 22, 23, 28, 29, 30] },
    { id: "grand-hall", name: "Grand Hall", tone: "#d8d7e1", cells: [24, 25, 31, 32] },
    { id: "service-wing", name: "Service Wing", tone: "#e2d6c4", cells: [26, 27, 33, 34] },
    { id: "courtyard", name: "Courtyard", tone: "#d2dfd1", cells: [35, 36, 37, 38, 42, 43, 44, 45] },
    { id: "south-suites", name: "South Suites", tone: "#dcd3dc", cells: [39, 40, 41, 46, 47, 48] }
  ],
  passages: [
    { cells: [4, 11], type: "door", label: "Gallery door" },
    { cells: [6, 13], type: "door", label: "East gallery door" },
    { cells: [20, 27], type: "door", label: "East service door" },
    { cells: [34, 41], type: "door", label: "South service door" },
    { cells: [38, 39], type: "gate", label: "Courtyard gate" },
    { cells: [33, 40], type: "door", label: "Service stair door" },
    { cells: [32, 33], type: "hatch", code: "H", label: "Staff hatch H" },
    { cells: [25, 26], type: "door", label: "Hall service door" },
    { cells: [19, 26], type: "door", label: "East service door" },
    { cells: [17, 24], type: "door", label: "East hall door" },
    { cells: [23, 24], type: "door", label: "Lounge hall door" },
    { cells: [30, 37], type: "door", label: "Lounge terrace door" },
    { cells: [28, 35], type: "gate", label: "West courtyard gate" },
    { cells: [14, 21], type: "door", label: "Lobby lounge door" },
    { cells: [0, 7], type: "door", label: "North lobby door" },
    { cells: [3, 10], type: "door", label: "Gallery east door" },
    { cells: [9, 10], type: "gate", code: "G", label: "Brass lobby gate G" },
    { cells: [2, 9], type: "door", label: "Gallery lobby door" },
    { cells: [16, 17], type: "door", label: "Lobby east door" },
    { cells: [15, 22], type: "door", label: "Lobby lounge door" },
    { cells: [18, 25], type: "door", label: "East hall door" },
    { cells: [29, 36], type: "gate", label: "Central courtyard gate" },
    { cells: [45, 46], type: "gate", label: "South courtyard gate" }
  ],
  objects: [
    { cell: 8, type: "desk", shortLabel: "Desk", label: "Reception desk", blocking: true },
    { cell: 12, type: "statue", shortLabel: "Statue", label: "Marble statue", blocking: true },
    { cell: 31, type: "piano", shortLabel: "Piano", label: "Grand piano", blocking: true },
    { cell: 44, type: "fountain", shortLabel: "Fountain", label: "Courtyard fountain", blocking: true }
  ],
  evidence: {
    weapon: { cell: 33, shortLabel: "W", label: "Missing letter opener", type: "weapon" },
    victim: { cell: 25, shortLabel: "V", label: "Adrian Vale", type: "victim" }
  },
  suspects: [
    {
      id: "sara",
      name: "Sara Bell",
      initials: "SB",
      color: "#e45f5f",
      start: 14,
      end: 15,
      length: 10,
      clue: "Sara’s keycard opened brass gate G.",
      markers: [],
      waypoints: [],
      requiredEdges: [[9, 10]]
    },
    {
      id: "marcus",
      name: "Marcus Reed",
      initials: "MR",
      color: "#d4932f",
      start: 34,
      end: 38,
      length: 7,
      clue: "Marcus left no print on the weapon cabinet.",
      markers: [],
      waypoints: [],
      forbiddenCells: [33]
    },
    {
      id: "nora",
      name: "Nora Finch",
      initials: "NF",
      color: "#2c9a86",
      start: 23,
      end: 21,
      length: 11,
      clue: "Lounge camera L1 recorded Nora before L2.",
      markers: [
        { cell: 30, shortLabel: "L1", label: "Lounge camera L1" },
        { cell: 29, shortLabel: "L2", label: "Lounge camera L2" }
      ],
      waypoints: [30, 29],
      orderedWaypoints: true
    },
    {
      id: "elias",
      name: "Elias Voss",
      initials: "EV",
      color: "#5074d8",
      start: 39,
      end: 24,
      length: 10,
      clue: "Elias’s keycard opened staff hatch H.",
      markers: [],
      waypoints: [],
      requiredEdges: [[32, 33]]
    },
    {
      id: "vivian",
      name: "Vivian Cross",
      initials: "VC",
      color: "#8b62c0",
      start: 11,
      end: 27,
      length: 7,
      clue: "East camera E3 recorded Vivian.",
      markers: [{ cell: 20, shortLabel: "E3", label: "East camera E3" }],
      waypoints: [20]
    }
  ],
  solution: {
    sara: [14, 7, 0, 1, 2, 3, 10, 9, 16, 15],
    marcus: [34, 41, 48, 47, 46, 45, 38],
    nora: [23, 30, 37, 36, 43, 42, 35, 28, 29, 22, 21],
    elias: [39, 40, 33, 32, 25, 26, 19, 18, 17, 24],
    vivian: [11, 4, 5, 6, 13, 20, 27]
  },
  hints: [
    "Start with Nora. L1 must appear before L2, so her first move cannot be west.",
    "Sara must use brass gate G; one apparent shortcut through the East Wing cannot satisfy that keycard record.",
    "Marcus cannot step on the weapon cabinet, even though the service corridor appears shorter.",
    "Vivian must reach E3 in only seven tiles, which fixes which gallery door she uses.",
    "Hatch H belongs to Elias. Once his trail crosses it, the weapon-before-victim sequence becomes possible."
  ]
};
