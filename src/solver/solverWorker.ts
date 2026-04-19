import Dictionary from "./dictionary";
import { GPUSolver } from "./gpu/gpuSolver";
import { Solver } from "./solver";
import {
  buildPuzzleContext,
  type PuzzleContext,
  type SolverRequest,
  type SolverResponse,
  type ValidWord,
} from "./types";

const WORD_LIST_URL = "/letter-boxed/word_list.txt";

let gpuSolver: GPUSolver | null | undefined; // undefined = not checked yet

interface PuzzleCache {
  key: string;
  ctx: PuzzleContext;
  validWords: ValidWord[];
}
let puzzleCache: PuzzleCache | null = null;

async function getGPUSolver(): Promise<GPUSolver | null> {
  if (gpuSolver !== undefined) return gpuSolver;
  gpuSolver = await GPUSolver.create();
  if (gpuSolver) {
    console.log("[Solver] Using WebGPU for findBest");
  } else {
    console.log("[Solver] WebGPU not available, using CPU fallback");
  }
  return gpuSolver;
}

async function getPuzzle(sides: string[]): Promise<{ dictionary: Dictionary; cache: PuzzleCache }> {
  const t0 = performance.now();
  const dictionary = await Dictionary.load(WORD_LIST_URL);
  const dictTime = performance.now() - t0;

  const key = sides.join("|").toUpperCase();
  if (puzzleCache?.key === key) {
    return { dictionary, cache: puzzleCache };
  }

  const ctx = buildPuzzleContext(sides);

  const t1 = performance.now();
  const validWords = dictionary.getValidWords(ctx);
  const filterTime = performance.now() - t1;

  console.log(
    `[Solver] ${validWords.length} valid words (dict: ${dictTime.toFixed(1)}ms, filter: ${filterTime.toFixed(1)}ms)`,
  );

  puzzleCache = { key, ctx, validWords };
  return { dictionary, cache: puzzleCache };
}

async function handleRequest(request: SolverRequest): Promise<SolverResponse> {
  const {
    dictionary,
    cache: { ctx, validWords },
  } = await getPuzzle(request.sides);

  if (request.type === "solve") {
    const solver = new Solver(ctx, dictionary);
    const t2 = performance.now();
    const result = solver.solve();
    const solveTime = performance.now() - t2;
    console.log(`[Solver] solve() completed in ${solveTime.toFixed(1)}ms (CPU backtracking)`);
    return { type: "solveResult", ...result };
  }

  // findBest — try GPU, then CPU word-level, then CPU backtracking
  const gpu = await getGPUSolver();
  if (gpu) {
    try {
      const t2 = performance.now();
      const result = await gpu.findBest(validWords, request.numWords, ctx.allCoveredMask);
      const gpuTime = performance.now() - t2;
      console.log(`[Solver] findBest() GPU completed in ${gpuTime.toFixed(1)}ms`);
      if (result.success) {
        return { type: "findBestResult", ...result };
      }
      console.log("[Solver] GPU found no solution, falling back to CPU");
    } catch (err) {
      console.warn("[Solver] GPU findBest failed, falling back to CPU:", err);
    }
  }

  // CPU word-level search
  const t3 = performance.now();
  const cpuResult = Solver.findBestCPU(validWords, request.numWords, ctx.allCoveredMask);
  const cpuWordTime = performance.now() - t3;
  console.log(`[Solver] findBest() CPU word-level completed in ${cpuWordTime.toFixed(1)}ms`);
  if (cpuResult.success) {
    return { type: "findBestResult", ...cpuResult };
  }

  // Last resort: character-level backtracking (for 4-5 word solutions)
  const t4 = performance.now();
  const solver = new Solver(ctx, dictionary);
  const fbResult = solver.findBestBacktracking(request.numWords);
  const btTime = performance.now() - t4;
  console.log(`[Solver] findBest() CPU backtracking completed in ${btTime.toFixed(1)}ms`);
  return { type: "findBestResult", ...fbResult };
}

self.onmessage = async (e: MessageEvent<SolverRequest>) => {
  try {
    const t0 = performance.now();
    const response = await handleRequest(e.data);
    const totalTime = performance.now() - t0;
    console.log(`[Solver] Total worker time: ${totalTime.toFixed(1)}ms`);
    self.postMessage(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: "error", message } satisfies SolverResponse);
  }
};
