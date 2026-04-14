Inspired by The NYTimes' [Letter Boxed](https://www.nytimes.com/puzzles/letter-boxed) Game

Check out the visualizer at https://aaron-ang.github.io/letter-boxed

## Architecture

The solver runs entirely in the browser — no server required.

- **Frontend**: React + MUI, built with [Vite](https://vite.dev/)
- **Solver**: TypeScript, runs in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) to keep the UI responsive
- **GPU acceleration**: [WebGPU](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) compute shaders for `Find Best` (with CPU fallback)
- **Testing**: [Vitest](https://vitest.dev/)
- **Linting**: [Biome](https://biomejs.dev/)

## Solver optimizations

- **Bitmask letter tracking**: 12 puzzle letters mapped to a 12-bit integer. `allLettersUsed()` is a single bitwise OR + comparison instead of nested string scanning
- **Precomputed adjacency**: `onSameSide()` reduced from linear search to array lookup via `sideOf[]`
- **Dictionary filtering**: 26K words filtered to ~300 valid words per puzzle before solving
- **Word-level combinatorial search**: `Find Best` checks word pairs/triples using bitmask coverage instead of character-by-character backtracking
- **WebGPU multi-pass**: GPU extends word chains across up to 5 passes (1→2→3→4→5 words), checking chain constraints and coverage in parallel

## Features

- `Solve` finds the first valid solution with step-by-step visualization
- `Find Best` finds the optimal solution (fewest words, then shortest total length)
- Slider to step through the solving process
- Customizable visualization delay
- Random puzzle generator using [most frequent English letters](https://mathcenter.oxford.emory.edu/site/math125/englishLetterFreqs/)
- Caches previous puzzle results to prevent recomputation

## Development

```sh
pnpm install
pnpm dev        # start dev server
pnpm build      # production build
pnpm test       # run tests
pnpm lint       # check linting
```

## Demo video

<img src='walkthrough.gif' title='Video Walkthrough' width='' alt='Video Walkthrough' />
