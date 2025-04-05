import { useState } from "react";
import axios from "axios";

type LetterSquareResponse = {
  success: boolean;
  data: string[][] | string[];
};

interface SolveResponse extends LetterSquareResponse {
  data: string[][];
}

interface FindBestResponse extends LetterSquareResponse {
  data: string[];
}

export function useLetterBoxedAPI() {
  const CLOUD_FUNCTION_URL =
    process.env.NEXT_PUBLIC_CLOUD_FUNCTION_URL_PROD || "http://localhost:8080/";

  const [solving, setSolving] = useState(false);

  async function getSolution(input: string[]): Promise<SolveResponse>;
  async function getSolution(
    input: string[],
    length: number
  ): Promise<FindBestResponse>;
  async function getSolution(input: string[], length?: number) {
    const res = await axios.get(CLOUD_FUNCTION_URL!, {
      params: { input, length },
    });
    return res.data;
  }

  const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  return {
    solving,
    setSolving,
    getSolution,
    sleep,
  };
}
