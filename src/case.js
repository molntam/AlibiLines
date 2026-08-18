export const hotelCase = {
  id: "blackthorn-hotel",
  number: "001",
  title: "Blackthorn Hotel",
  size: 7,
  timeWindow: "21:10–21:25",
  victimName: "Adrian Vale",
  briefing:
    "The hotel cameras failed for fifteen minutes. Five guests were recorded immediately before and after the blackout. A letter opener vanished from the service wing, and Adrian Vale was found in the residents’ lounge.",
  objective:
    "Reconstruct every trail. The killer is the suspect whose route reaches the weapon before the victim.",
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
  evidence: {
    weapon: { cell: 33, shortLabel: "W", label: "Missing letter opener" },
    victim: { cell: 29, shortLabel: "V", label: "Adrian Vale" }
  },
  suspects: [
    {
      id: "sara",
      name: "Sara Bell",
      initials: "SB",
      color: "#e45f5f",
      start: 0,
      end: 27,
      length: 10,
      clue: "Camera N2 recorded Sara in the North Gallery.",
      markers: [{ cell: 5, shortLabel: "N2", label: "North camera N2" }],
      waypoints: [5]
    },
    {
      id: "marcus",
      name: "Marcus Reed",
      initials: "MR",
      color: "#d4932f",
      start: 34,
      end: 35,
      length: 10,
      clue: "Wet footprints place Marcus at the courtyard fountain.",
      markers: [{ cell: 45, shortLabel: "F", label: "Courtyard fountain" }],
      waypoints: [45]
    },
    {
      id: "nora",
      name: "Nora Finch",
      initials: "NF",
      color: "#2c9a86",
      start: 28,
      end: 19,
      length: 10,
      clue: "Nora’s keycard opened the lobby gate.",
      markers: [{ cell: 9, shortLabel: "G", label: "Lobby security gate" }],
      waypoints: [9]
    },
    {
      id: "elias",
      name: "Elias Voss",
      initials: "EV",
      color: "#5074d8",
      start: 26,
      end: 15,
      length: 10,
      clue: "Elias used the courtyard service door.",
      markers: [{ cell: 37, shortLabel: "D", label: "Courtyard service door" }],
      waypoints: [37]
    },
    {
      id: "vivian",
      name: "Vivian Cross",
      initials: "VC",
      color: "#8b62c0",
      start: 16,
      end: 24,
      length: 9,
      clue: "Camera L1 recorded Vivian before camera H1.",
      markers: [
        { cell: 23, shortLabel: "L1", label: "Lounge camera L1" },
        { cell: 32, shortLabel: "H1", label: "Hall camera H1" }
      ],
      waypoints: [23, 32],
      orderedWaypoints: true
    }
  ],
  solution: {
    sara: [0, 1, 2, 3, 4, 5, 6, 13, 20, 27],
    marcus: [34, 41, 48, 47, 46, 45, 44, 43, 42, 35],
    nora: [28, 21, 14, 7, 8, 9, 10, 11, 12, 19],
    elias: [26, 33, 40, 39, 38, 37, 36, 29, 22, 15],
    vivian: [16, 23, 30, 31, 32, 25, 18, 17, 24]
  },
  hints: [
    "Start with Sara. Camera N2 and her ten-tile limit force her across the entire north edge.",
    "Keep the west edge available for Nora. Otherwise she cannot reach the East Wing in exactly ten tiles.",
    "Marcus needs the outside route around the South Suites to reach the courtyard exit.",
    "Vivian reaches L1 before H1, so her trail enters the centre from the Lounge side.",
    "Elias must reach the courtyard service door, but his route also needs a way back to the Lobby."
  ]
};
