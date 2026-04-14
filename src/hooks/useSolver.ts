import { useCallback, useEffect, useRef, useState } from "react";
import type { SolverRequest, SolverResponse } from "../solver/types";

interface SolveResponse {
  success: boolean;
  data: string[][];
}

interface FindBestResponse {
  success: boolean;
  data: string[];
}

export function useSolver() {
  const [solving, setSolving] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL("../solver/solverWorker.ts", import.meta.url), {
        type: "module",
      });
    }
    return workerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  async function getSolution(input: string[]): Promise<SolveResponse>;
  async function getSolution(input: string[], length: number): Promise<FindBestResponse>;
  async function getSolution(
    input: string[],
    length?: number,
  ): Promise<SolveResponse | FindBestResponse> {
    const worker = getWorker();

    return new Promise((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<SolverResponse>) => {
        const msg = e.data;
        if (msg.type === "solveResult") {
          resolve({ success: msg.success, data: msg.data });
        } else if (msg.type === "findBestResult") {
          resolve({ success: msg.success, data: msg.data });
        } else if (msg.type === "error") {
          reject(new Error(msg.message));
        }
      };
      worker.onerror = (e) => reject(new Error(e.message));

      const request: SolverRequest =
        length !== undefined
          ? { type: "findBest", sides: input, numWords: length }
          : { type: "solve", sides: input };

      worker.postMessage(request);
    });
  }

  const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  return { solving, setSolving, getSolution, sleep };
}
