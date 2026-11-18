# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Critical path method (CPM) calculator: a single-page React 19 + Vite app with no backend. UI text, comments and error messages are in Spanish; keep them in Spanish.

## Commands

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # static build into dist/
npm run preview  # serve dist/
npm run verificar   # CPM regression cases (.claude/skills/verificar-cpm/casos.json)
```

There is no linter or test framework. `npm run verificar` is the check to run after touching `src/lib/cpm.js`; the `verificar-cpm` skill explains how to read failures and add cases.

## Architecture

- **`src/lib/cpm.js` holds all domain logic and must stay free of React.** `computeCPM(acts, roundUp)` returns `{ errs, warns, result }`. `result` is `null` when there is nothing to draw (no valid activities or a dependency cycle). Otherwise it is `{ nodes, map, T, paths }`:
  - `nodes` is in topological order. Each node has `ES/EF/LS/LF` (early/late start/finish), `TF/FF` (total/free float), `crit`, `preds/succs` (ids), `order` (original row index) and `d` (duration after productivity).
  - `paths` lists the critical paths, capped at 30.
- **Data flow:** `App.jsx` owns the raw input rows `acts` (`{id, dur, pred, prod}`, all strings exactly as typed). It derives `result` with `useMemo(computeCPM)`, and the components only render it. Validation never blocks: bad rows become `errs`/`warns` messages and are skipped.
- **Persistence:** `localStorage` keys `cpm-acts` and `cpm-round` are shared with the original single-file HTML version. Don't rename them, or users lose their saved data.
- **Productivity:** the `prod` column (`1+0.5`, `1+50%`, `2`) is summed by `parseProd`, and the duration is divided by it. When `roundUp` is set, adjusted durations are rounded up with `Math.ceil`. Float comparisons use `EPS`.
- **Diagram:** `NetworkDiagram.jsx` computes its own layout: columns by dependency depth, then 6 barycenter passes to reduce crossings. It draws 3×3 nodes (ES | EF / TF · id · TF / LS | dur | LF) as hand-built SVG. Its styles are CSS classes in `src/styles.css` (`n-rect`, `n-div`, `e`, `.c` for critical) that use the CSS variables, so dark mode works automatically.
- **Text format:** `toText`/`fromText` handle the "Editar como texto" mode, one activity per line: `ID duración predecesoras [@productividad]`, with `-` meaning no predecessors.
- **Build base:** `vite.config.js` uses `base: './'` so `dist/` works when hosted from any subpath (e.g. GitHub Pages).
