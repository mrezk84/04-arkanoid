# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Browser Arkanoid/Breakout game: plain HTML + CSS + JavaScript, **zero dependencies**, meant to be played directly in a browser (see `READMNE.md`). **The game itself is not implemented yet** — the repo currently holds only assets and a sprite-rendering helper. There is no `index.html`, no `package.json`, no build step, and no test runner.

To run whatever gets built, open the entry HTML file in a browser or serve the folder statically (e.g. `python3 -m http.server`). Do not introduce a bundler, framework, or npm dependency — the zero-dependency constraint is the point of the exercise.

## Rendering: `assets/spritesheet.js`

The only existing code. All in-game drawing must go through it rather than loading `assets/spritesheet-breakout.png` (559×337) directly.

- `loadSpritesheet(cb)` — loads the PNG once into an offscreen canvas, then invokes `cb` (queues the callback if still loading). Call before the first frame.
- `drawSprite(ctx, name, x, y, w, h)` — `name` is a key of `SPRITES` (`'paddle'`, `'ball'`) or `'block_<color>'` (`red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`, `gray`).
- `drawFrame(ctx, frame, x, y, w, h)` — draws one explosion frame; `EXPLOSION_FRAMES[color]` is a 4-frame array, `EXPLOSION_DURATION` / `EXPLOSION_FRAMES` gate the animation timing.
- Both draw calls are no-ops until the sheet has loaded.

Sounds: `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3`.

Match the existing code style in this file: spaces inside parens and brackets (`fn( a, b )`, `arr[ i ]`), 2-space indent, `const`/`let`, single quotes.

## Spec-driven workflow

Feature work follows a spec-first process backed by two skills, `spec` and `spec-impl` (defined in `.agents/skills/`, mirrored under `.claude/skills/`, pinned in `skills-lock.json` from `Klerith/fernando-skills`).

- `/spec <one-sentence description>` — clarifies requirements through question blocks, then writes `specs/NN-slug.md` (sequential number, `Draft` state). It never writes code. `specs/` does not exist yet; the first spec creates it plus `specs/.spec-config.yml` (`AutoCreateBranch: true`).
- `/spec-impl NN-slug` — refuses unless the spec's status line means **Approved** (any language); a human makes that change, not the agent. Then creates/switches to branch `spec-NN-slug` and implements the plan step by step, pausing after each step, never committing on its own.

Reply in the same language as the prompt that started the task (the README and skills are Spanish-oriented).
