# Alibi Lines

Alibi Lines is a web-based, timed route-deduction murder mystery. Players reconstruct five suspect timelines and the victim's timeline from camera records, access logs and physical traces. Routes may cross; the murderer is revealed only after all six timelines are verified.

This repository contains the playable prototype: **Case 001 — Blackthorn Hotel**.

## Prototype rules

1. Select a person. Only that person's evidence pins appear on the floor plan.
2. Draw horizontally or vertically. Every move advances the case clock by one minute; **Wait** keeps the person on the same tile for one minute.
3. Cross room boundaries only through marked doors, gates or hatches. Fixed furniture blocks its tile.
4. There is no displayed route-length target and no generic start/end marker. Timestamps and the evidence window determine the timeline.
5. Different people's routes may cross or overlap. A single timeline cannot return to a tile after leaving it.
6. Reconstruct all five suspects and Adrian Vale. The murderer remains hidden until every timeline is complete.
7. The forensic window identifies the killer: only a same-tile, same-minute meeting with Adrian during 21:17–21:18 is incriminating.

The single-floor case uses a 7×7 hotel plan, four pieces of blocking furniture and 23 architectural passages. Every suspect crosses Adrian's spatial route somewhere, so route shape alone is deliberately inconclusive.

## Run locally

The prototype has no runtime dependencies or build step.

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Validate the case

```bash
npm run check
```

The exhaustive verifier allows both movement and waiting. It proves that:

- every person's complete timeline is individually unique;
- all authored moves obey walls, doors, gates, hatches and blockers;
- every suspect intersects Adrian's route in space;
- only Marcus Reed meets Adrian at the same minute inside the forensic attack window.

## Deployment

The included GitHub Actions workflow verifies the game and deploys the static files to GitHub Pages after changes reach `main`. GitHub Pages must use **GitHub Actions** as its publishing source in the repository settings.

Expected address after Pages is enabled:

`https://molntam.github.io/AlibiLines/`

## Project structure

- `index.html` — game screen and dialogs
- `styles.css` — responsive case-file interface
- `src/case.js` — Case 001 architecture, timed evidence and verified solution
- `src/game-logic.js` — movement, evidence, timeline and murderer validation
- `src/app.js` — drawing, waiting, clue rendering and persistence behavior
- `scripts/verify-puzzle.mjs` — exhaustive timeline uniqueness verification
- `tests/` — route and deduction logic tests
