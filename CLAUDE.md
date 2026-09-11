# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Browser Arkanoid/Breakout game: plain HTML + CSS + JavaScript, **zero dependencies**, meant to be played directly in a browser (see `READMNE.md`). The MVP is implemented and playable, plus a block-destruction animation and a levels/pause/sound layer on top of it — each built through the spec-driven workflow below (`specs/01-mvp-jugable.md`, `specs/02-animacion-destruccion-bloques.md`, `specs/03-niveles-y-sonido.md`). There is no `package.json`, no build step, and no test runner — verification is manual, per the "Test manual" note on each spec step.

To run the game, open `index.html` in a browser or serve the folder statically (e.g. `python3 -m http.server`). Do not introduce a bundler, framework, or npm dependency — the zero-dependency constraint is the point of the exercise.

## File layout

- `index.html` — canvas (`#game`, 800×600) plus script tags, load order matters: `assets/spritesheet.js` → `levels.js` → `game.js`.
- `styles.css` — centers the canvas on a dark page background.
- `levels.js` — global data only, no logic: `LEVELS` (layouts, one letter per block color, `.` for a gap), `LEVEL_LETTERS`, `LEVEL_SPEED_STEP`, `LEVEL_CLEAR_DURATION`.
- `game.js` — all game logic: `state` (`phase`, `score`, `lives`, `level`), paddle/ball/blocks/explosions, update functions (`updateBall`, `bounceOnPaddle`, `bounceOnBlocks`, `updateExplosions`, `updatePaddle`), draw functions (`draw`, `drawHud`, `drawOverlay`, `drawPauseOverlay`, `drawExplosions`), sound helpers (`playSound`, `unlockAudio`), and the `requestAnimationFrame` loop (`frame`), started after `loadSpritesheet`.
- `assets/spritesheet.js` — the only pre-existing code (see below).
- `assets/sounds/*.mp3` — `ball-bounce.mp3`, `break-sound.mp3`.
- `specs/` — one Markdown file per feature, see workflow below.

`state.phase` is the top-level state machine: `'playing' | 'levelclear' | 'paused' | 'gameover' | 'win'`. `frame()` only calls `updateBall` while `'playing'`; every phase but `'playing'` freezes the simulation and shows its own overlay via `draw()`.

## Rendering: `assets/spritesheet.js`

All in-game drawing must go through it rather than loading `assets/spritesheet-breakout.png` (559×337) directly.

- `loadSpritesheet(cb)` — loads the PNG once into an offscreen canvas, then invokes `cb` (queues the callback if still loading). Call before the first frame.
- `drawSprite(ctx, name, x, y, w, h)` — `name` is a key of `SPRITES` (`'paddle'`, `'ball'`) or `'block_<color>'` (`red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`, `gray`).
- `drawFrame(ctx, frame, x, y, w, h)` — draws one explosion frame; `EXPLOSION_FRAMES[color]` is a 4-frame array, `EXPLOSION_DURATION` / `EXPLOSION_FRAMES` gate the animation timing.
- Both draw calls are no-ops until the sheet has loaded.

Match the existing code style: spaces inside parens and brackets (`fn( a, b )`, `arr[ i ]`), 2-space indent, `const`/`let`, single quotes. New Spanish comments only where the *why* isn't obvious from the code (that's the existing pattern in `game.js`/`levels.js`).

## Spec-driven workflow

All feature work goes through a spec-first process backed by two skills, `spec` and `spec-impl` (defined in `.agents/skills/`, mirrored under `.claude/skills/`, pinned in `skills-lock.json` from `Klerith/fernando-skills`). Do not hand-write features straight into `game.js`/`levels.js` without a spec — that's the pattern established by the three specs already merged.

- `/spec <one-sentence description>` — clarifies requirements through question blocks, then writes `specs/NN-slug.md` (sequential number, e.g. `04-...`, zero-padded two digits; `Draft` state). It never writes code.
- A human then edits the spec's status line to **Aprobado/Approved** — the agent never flips this itself.
- `/spec-impl NN-slug` — refuses unless the status line means Approved. Then creates/switches to branch `spec-NN-slug` (auto, since `specs/.spec-config.yml` has `AutoCreateBranch: true`) and implements the plan step by step, pausing after each step for manual testing, never committing on its own.

Each spec file follows the same shape (see the three existing ones for reference): a `> **Status:** ...` line up top, a plain-language description of the feature, explicit "Sí/No" scope boundaries, a code sketch of the state/data shape being added, and a numbered implementation plan where every step ends in "Test manual: ...". Match that structure when writing or reviewing specs.

Reply in the same language as the prompt that started the task (the README, specs and skills are Spanish-oriented).
