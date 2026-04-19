import type { SolverRequest, SolverResponse } from "./types";

interface SolveResponse {
  success: boolean;
  data: string[][];
}

interface FindBestResponse {
  success: boolean;
  data: string[];
}

let worker: Worker | null = null;

function getWorker(): Worker {
  worker ??= new Worker(new URL("./solverWorker.ts", import.meta.url), { type: "module" });
  return worker;
}

export async function getSolution(input: string[]): Promise<SolveResponse>;
export async function getSolution(input: string[], length: number): Promise<FindBestResponse>;
export async function getSolution(
  input: string[],
  length?: number,
): Promise<SolveResponse | FindBestResponse> {
  const w = getWorker();
  return new Promise((resolve, reject) => {
    w.onmessage = (e: MessageEvent<SolverResponse>) => {
      const msg = e.data;
      if (msg.type === "solveResult") {
        resolve({ success: msg.success, data: msg.data });
      } else if (msg.type === "findBestResult") {
        resolve({ success: msg.success, data: msg.data });
      } else if (msg.type === "error") {
        reject(new Error(msg.message));
      }
    };
    w.onerror = (e) => reject(new Error(e.message));

    const request: SolverRequest =
      length !== undefined
        ? { type: "findBest", sides: input, numWords: length }
        : { type: "solve", sides: input };
    w.postMessage(request);
  });
}
