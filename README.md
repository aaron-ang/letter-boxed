# Letter Boxed Solver

Inspired by The NYTimes' [Letter Boxed](https://www.nytimes.com/puzzles/letter-boxed) game.

Check out the visualizer at [aaron-ang.github.io/letter-boxed](https://aaron-ang.github.io/letter-boxed).

## Architecture

- **Frontend**: React + [shadcn/ui](https://ui.shadcn.com/) + [Tailwind v4](https://tailwindcss.com/), built with [Vite](https://vite.dev/)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/) store
- **Solver**: TypeScript, runs in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) to keep the UI responsive
- **GPU acceleration**: [WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) compute shaders for `Find Best` (with CPU fallback)
- **Testing**: [Vitest](https://vitest.dev/)
- **Linting**: [Biome](https://biomejs.dev/)

## Solver optimizations

- **Bitmask letter tracking**: 12 puzzle letters mapped to a 12-bit integer. `allLettersUsed()` is a single bitwise OR + comparison
- **Precomputed adjacency**: `onSameSide()` uses array lookup via `sideOf[]`
- **Dictionary filtering**: 26K words filtered to ~300 valid words per puzzle before solving
- **Word-level combinatorial search**: `Find Best` checks word pairs/triples using bitmask coverage
- **WebGPU multi-pass**: GPU extends word chains across up to 5 passes (1→2→3→4→5 words), checking chain constraints and coverage in parallel

## Features

- `Solve` finds the first valid solution with step-by-step visualization
- `Find Best` finds the optimal solution (fewest words, then shortest total length)
- Slider + prev/next buttons to step through the solving process
- Each letter's usage rendered as a numbered bubble on the assigned side of the cell (word 0 = top, 1 = left, 2 = bottom, 3 = right, 4 = top-right corner), with a color-per-word palette. Linking letters get one bubble per word they appear in
- Customizable visualization delay
- Random puzzle generator using [most frequent English letters](https://mathcenter.oxford.emory.edu/site/math125/englishLetterFreqs/)
- Caches previous puzzle results to prevent recomputation

## Development

```sh
bun install
bun run dev     # start dev server
bun run build   # production build
bun run test    # run tests
bun run lint    # check linting
bun run format  # format files
```

## Demo video

![Video Walkthrough](assets/walkthrough.gif)
