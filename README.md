# Alibi Lines

Alibi Lines is a web-based route-deduction murder mystery. During a camera blackout, every suspect moved between two confirmed sightings. The player reconstructs all trails, accounts for every floor tile and identifies the route that reached the weapon before the victim.

This repository contains the first playable prototype: **Case 001 — Blackthorn Hotel**.

## Prototype rules

1. Connect each suspect's filled 21:10 marker to their outlined 21:25 marker.
2. Move horizontally or vertically; trails cannot overlap.
3. Use the exact number of tiles shown on each suspect card.
4. Assign every floor tile to exactly one suspect.
5. Satisfy every evidence card and ordered camera clue.
6. The killer is the trail that reaches the weapon before the victim.

The authored case has five suspects on a 7×7 floor plan. Each suspect has multiple legal personal routes, while the complete board has exactly one solution.

## Run locally

The prototype has no runtime dependencies or build step.

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Validate the case

```bash
node --test
node scripts/verify-puzzle.mjs
node --check src/app.js
```

The uniqueness verifier enumerates each suspect's legal personal routes, combines them under the non-overlap and full-coverage rules, and fails unless exactly one complete solution remains.

## Deployment

The included GitHub Actions workflow verifies the game and deploys the static files to GitHub Pages after changes reach `main`. GitHub Pages must use **GitHub Actions** as its publishing source in the repository settings.

Expected address after Pages is enabled:

`https://molntam.github.io/AlibiLines/`

## Project structure

- `index.html` — game screen and dialogs
- `styles.css` — responsive case-file interface
- `src/case.js` — Case 001 data, evidence and verified solution
- `src/game-logic.js` — route and board validation
- `src/app.js` — pointer, touch, keyboard and persistence behavior
- `scripts/verify-puzzle.mjs` — exhaustive uniqueness verification
- `tests/` — route-logic tests
