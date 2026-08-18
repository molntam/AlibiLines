export const hotelCase = {
  id: "blackthorn-hotel-v3",
  number: "001",
  title: "Blackthorn Hotel",
  size: 7,
  difficulty: "Investigative",
  timeline: {
    startMinutes: 21 * 60 + 10,
    endOffset: 12,
    label: "21:10–21:22",
    minutePerMove: 1
  },
  victimId: "adrian",
  briefing:
    "A twelve-minute camera failure scattered six incomplete timelines across Blackthorn Hotel. Adrian Vale was found alive but unresponsive in the service wing and died before help arrived. Five guests claim they never met him.",
  objective:
    "Reconstruct all six minute-by-minute timelines from cameras, access logs and physical traces. Routes may cross; only a meeting at the forensic attack time can expose the killer.",
  forensics: {
    cause: "Single stab wound",
    attackWindow: [7, 8],
    attackWindowLabel: "21:17–21:18",
    survival: "Adrian remained mobile for approximately four to five minutes after the injury.",
    finding:
      "There was no usable weapon evidence. The murderer must have occupied Adrian’s exact location during the attack window."
  },
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
  people: [
    {
      id: "sara",
      role: "suspect",
      name: "Sara Bell",
      initials: "SB",
      color: "#e45f5f",
      evidence: [
        { id: "sara-e1", type: "point", at: 0, cell: 11, code: "E1", title: "East camera E1", text: "Sara appeared in the East Wing at 21:10." },
        { id: "sara-n2", type: "point", at: 3, cell: 6, code: "N2", title: "North camera N2", text: "Camera N2 recorded Sara at 21:13." },
        { id: "sara-door", type: "edge", at: 6, cells: [20, 27], code: "D4", title: "Service door sensor", text: "The east service door opened for Sara at 21:16." },
        { id: "sara-linen", type: "point", at: 7, cell: 34, code: "L", title: "Laundry shelf sensor", text: "A linen-room shelf registered Sara's staff tag at 21:17." },
        { id: "sara-balcony", type: "point", at: 9, cell: 48, code: "S4", title: "Suite 4 door contact", text: "Sara opened the Suite 4 balcony door at 21:19." },
        { id: "sara-hair", type: "trace", cell: 47, window: [9, 11], code: "H", title: "Hair on the bed", text: "Fresh hair placed Sara in Suite 3 between 21:19 and 21:21." },
        { id: "sara-c4", type: "point", at: 12, cell: 45, code: "C4", title: "Courtyard camera C4", text: "Sara reached the south courtyard gate at 21:22." }
      ]
    },
    {
      id: "marcus",
      role: "suspect",
      name: "Marcus Reed",
      initials: "MR",
      color: "#d4932f",
      evidence: [
        { id: "marcus-l2", type: "point", at: 0, cell: 16, code: "L2", title: "Lobby camera L2", text: "Marcus was in the lower lobby at 21:10." },
        { id: "marcus-g", type: "edge", at: 2, cells: [9, 10], code: "G", title: "Keycard log G", text: "Marcus opened brass gate G at 21:12." },
        { id: "marcus-e2", type: "point", at: 3, cell: 17, code: "E2", title: "East camera E2", text: "A partial frame placed Marcus by camera E2 at 21:13." },
        { id: "marcus-e4", type: "point", at: 4, cell: 18, code: "E4", title: "East camera E4", text: "Camera E4 recorded Marcus at 21:14." },
        { id: "marcus-d7", type: "edge", at: 7, cells: [25, 26], code: "D7", title: "Hall service sensor", text: "Marcus crossed the hall service door at 21:17." },
        { id: "marcus-l3", type: "point", at: 9, cell: 23, code: "L3", title: "Lounge camera L3", text: "Marcus appeared at the lounge entrance at 21:19." },
        { id: "marcus-terrace", type: "edge", at: 11, cells: [30, 37], code: "D9", title: "Terrace door sensor", text: "The lounge terrace door opened for Marcus at 21:21." },
        { id: "marcus-c1", type: "point", at: 12, cell: 36, code: "C1", title: "Courtyard camera C1", text: "Marcus was beside the central courtyard gate at 21:22." }
      ]
    },
    {
      id: "nora",
      role: "suspect",
      name: "Nora Finch",
      initials: "NF",
      color: "#2c9a86",
      evidence: [
        { id: "nora-l1", type: "point", at: 0, cell: 21, code: "L1", title: "Lounge camera L1", text: "Nora entered the lounge at 21:10." },
        { id: "nora-till", type: "point", at: 2, cell: 29, code: "T", title: "Bar till record", text: "Nora tapped the lounge till at 21:12." },
        { id: "nora-g2", type: "edge", at: 4, cells: [28, 35], code: "G2", title: "West gate record", text: "Nora opened the west courtyard gate at 21:14." },
        { id: "nora-mud", type: "trace", cell: 43, window: [5, 7], code: "M", title: "Wet footprints", text: "Nora’s wet footprints reached the fountain path between 21:15 and 21:17." },
        { id: "nora-c2", type: "point", at: 8, cell: 37, code: "C2", title: "Courtyard camera C2", text: "Camera C2 recorded Nora at 21:18." },
        { id: "nora-e2", type: "point", at: 12, cell: 17, code: "E2", title: "East camera E2", text: "Nora reached the East Wing at 21:22." }
      ]
    },
    {
      id: "elias",
      role: "suspect",
      name: "Elias Voss",
      initials: "EV",
      color: "#5074d8",
      evidence: [
        { id: "elias-c3", type: "point", at: 0, cell: 38, code: "C3", title: "Courtyard camera C3", text: "Elias was at the east courtyard gate at 21:10." },
        { id: "elias-g4", type: "edge", at: 1, cells: [38, 45], code: "G4", title: "South gate sensor", text: "The south courtyard gate opened for Elias at 21:11." },
        { id: "elias-s3", type: "point", at: 2, cell: 46, code: "S3", title: "Suite camera S3", text: "The south-suite camera recorded Elias at 21:12." },
        { id: "elias-bed", type: "point", at: 3, cell: 47, code: "P", title: "Suite pressure strip", text: "A pressure strip in Suite 3 detected Elias at 21:13." },
        { id: "elias-h", type: "edge", at: 6, cells: [32, 33], code: "H", title: "Staff hatch log", text: "Elias opened staff hatch H at 21:16." },
        { id: "elias-e4", type: "point", at: 8, cell: 18, code: "E4", title: "East camera E4", text: "Camera E4 recorded Elias at 21:18." },
        { id: "elias-e2", type: "point", at: 9, cell: 17, code: "E2", title: "East camera E2", text: "A second East Wing frame recorded Elias at 21:19." },
        { id: "elias-e1", type: "point", at: 10, cell: 10, code: "E1", title: "East camera E1", text: "Elias crossed camera E1 at 21:20." },
        { id: "elias-g", type: "edge", at: 11, cells: [9, 10], code: "G", title: "Brass gate log", text: "Elias opened brass gate G at 21:21." },
        { id: "elias-l2", type: "point", at: 12, cell: 16, code: "L2", title: "Lobby camera L2", text: "Elias returned to the lobby at 21:22." }
      ]
    },
    {
      id: "vivian",
      role: "suspect",
      name: "Vivian Cross",
      initials: "VC",
      color: "#8b62c0",
      evidence: [
        { id: "vivian-l3", type: "point", at: 0, cell: 23, code: "L3", title: "Lounge camera L3", text: "Vivian was at the lounge entrance at 21:10." },
        { id: "vivian-n1", type: "point", at: 4, cell: 3, code: "N1", title: "North camera N1", text: "Camera N1 recorded Vivian at 21:14." },
        { id: "vivian-l2", type: "point", at: 7, cell: 16, code: "L2", title: "Lobby camera L2", text: "Vivian crossed the lower lobby at 21:17." },
        { id: "vivian-g3", type: "edge", at: 11, cells: [29, 36], code: "G3", title: "Central gate record", text: "Vivian opened the central courtyard gate at 21:21." },
        { id: "vivian-vm", type: "point", at: 12, cell: 43, code: "VM", title: "Vending receipt", text: "A cashless receipt placed Vivian at the courtyard vending machine at 21:22." }
      ]
    },
    {
      id: "adrian",
      role: "victim",
      name: "Adrian Vale",
      initials: "AV",
      color: "#aeb6bd",
      evidence: [
        { id: "adrian-v1", type: "point", at: 0, cell: 14, code: "V1", title: "Lobby camera V1", text: "Adrian left reception at 21:10." },
        { id: "adrian-n0", type: "point", at: 2, cell: 0, code: "N0", title: "Gallery motion camera", text: "The west gallery camera registered Adrian at 21:12." },
        { id: "adrian-v2", type: "point", at: 4, cell: 2, code: "V2", title: "North camera V2", text: "Adrian passed camera V2 at 21:14." },
        { id: "adrian-d3", type: "edge", at: 6, cells: [3, 10], code: "D3", title: "Gallery door sensor", text: "Adrian opened the east gallery door at 21:16." },
        { id: "adrian-v3", type: "point", at: 7, cell: 17, code: "V3", title: "East camera V3", text: "Adrian entered the lower East Wing at 21:17." },
        { id: "adrian-beacon", type: "point", at: 8, cell: 24, code: "P", title: "Phone proximity log", text: "Adrian's phone reached the west Grand Hall beacon at 21:18." },
        { id: "adrian-blood", type: "trace", cell: 25, window: [8, 10], code: "B", title: "First blood drops", text: "The first blood drops were in the Grand Hall between 21:18 and 21:20." },
        { id: "adrian-service", type: "edge", at: 10, cells: [25, 26], code: "D7", title: "Bloody door plate", text: "Blood on the hall service door placed Adrian there at 21:20." },
        { id: "adrian-smear", type: "point", at: 11, cell: 27, code: "B2", title: "Corridor blood smear", text: "A second blood smear marked the east service corridor at 21:21." },
        { id: "adrian-med", type: "point", at: 12, cell: 34, code: "M", title: "Emergency call", text: "Staff found Adrian collapsed in the service wing at 21:22." }
      ]
    }
  ],
  solution: {
    sara: [11, 4, 5, 6, 13, 20, 27, 34, 41, 48, 47, 46, 45],
    marcus: [16, 9, 10, 17, 18, 19, 26, 25, 24, 23, 30, 37, 36],
    nora: [21, 22, 29, 28, 35, 42, 43, 36, 37, 30, 23, 24, 17],
    elias: [38, 45, 46, 47, 40, 33, 32, 25, 18, 17, 10, 9, 16],
    vivian: [23, 24, 17, 10, 3, 2, 9, 16, 15, 22, 29, 36, 43],
    adrian: [14, 7, 0, 1, 2, 3, 10, 17, 24, 25, 26, 27, 34]
  },
  hints: [
    "Treat every drawn segment as one minute. If a camera says 21:14, count from the 21:10 evidence pin.",
    "Waiting is legal, but it consumes a minute. A wait that misses a later timestamp cannot be part of the reconstruction.",
    "An access log fixes the exact minute a doorway was crossed, not merely a room that was visited.",
    "Two colored lines sharing a tile proves only that two people visited the same place. Compare their minutes before drawing a conclusion.",
    "Reconstruct Adrian as carefully as every suspect. The forensic window matters only after all six timelines are verified."
  ]
};
