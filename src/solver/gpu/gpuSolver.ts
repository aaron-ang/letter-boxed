import type { ValidWord } from "@/solver/types";
import shaderSource from "./wordCoverage.wgsl?raw";

// Chain layout: [w0, w1, w2, w3, w4, coverageMask, lastWordIdx, wordCount, totalChars]
const CHAIN_STRIDE = 9;
const CHAIN_BYTES = CHAIN_STRIDE * 4;
// WebGPU default limit for maxComputeInvocationsPerWorkgroup; clamped to device limits
const PREFERRED_WORKGROUP_SIZE = 256;
// Share of maxStorageBufferBindingSize given to each buffer
const SOLUTION_BUFFER_FRACTION = 0.05;
const CHAIN_BUFFER_FRACTION = 0.5;
// Cap on solutions collected per pass; plenty to pick the best from
const MAX_SOLUTIONS = 65_536;

export interface Solution {
  words: number[];
  totalChars: number;
}

/**
 * 1-word chains are the words themselves; the GPU passes only ever produce chains of 2+ words,
 * so full-coverage single words must be detected up front (on the CPU).
 */
export function findOneWordSolutions(validWords: ValidWord[], allCoveredMask: number): Solution[] {
  const solutions: Solution[] = [];
  for (let i = 0; i < validWords.length; i++) {
    if (validWords[i].coverageMask === allCoveredMask) {
      solutions.push({ words: [i], totalChars: validWords[i].word.length });
    }
  }
  return solutions;
}

interface PassResult {
  solutions: Solution[];
  nextCount: number;
  /** A buffer cap was hit, so some chains or solutions were dropped. */
  truncated: boolean;
}

/** Find Best result; `truncated` means the answer may be incomplete. */
export interface GPUResult {
  success: boolean;
  data: string[];
  truncated: boolean;
}

export class GPUSolver {
  private device: GPUDevice;
  private maxSolutions: number;
  private maxChains: number;
  private workgroupSize: number;

  private constructor(device: GPUDevice) {
    this.device = device;
    const { limits } = device;
    const cap = limits.maxStorageBufferBindingSize;
    this.maxSolutions = Math.min(
      Math.floor((cap * SOLUTION_BUFFER_FRACTION) / CHAIN_BYTES),
      MAX_SOLUTIONS,
    );
    this.maxChains = Math.floor((cap * CHAIN_BUFFER_FRACTION) / CHAIN_BYTES);
    this.workgroupSize = Math.min(
      PREFERRED_WORKGROUP_SIZE,
      limits.maxComputeInvocationsPerWorkgroup,
      limits.maxComputeWorkgroupSizeX,
    );
  }

  static async create(): Promise<GPUSolver | null> {
    if (typeof navigator === "undefined" || !navigator.gpu) return null;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return null;
      const device = await adapter.requestDevice();
      return new GPUSolver(device);
    } catch {
      return null;
    }
  }

  async findBest(
    validWords: ValidWord[],
    numWords: number,
    allCoveredMask: number,
  ): Promise<GPUResult> {
    const n = validWords.length;
    if (n === 0 || numWords < 1) return { success: false, data: [], truncated: false };
    if (n > this.maxChains)
      throw new Error(`${n} words exceed the chain buffer (${this.maxChains})`);

    const oneWord = findOneWordSolutions(validWords, allCoveredMask);
    if (oneWord.length > 0) {
      console.log(`[GPU] Pass 0: found ${oneWord.length} 1-word solutions (CPU check)`);
      return { ...this.selectBest(oneWord, validWords), truncated: false };
    }

    const pipeline = this.createPipeline();
    const wordBuffer = this.createWordBuffer(validWords);
    const solBuf = this.emptyStorage(this.maxSolutions * CHAIN_BYTES);
    const countsBuf = this.counterBuffer();

    // Chains stay on the GPU between passes: each pass reads one buffer and writes the other,
    // then the two swap roles. Only the counts (plus any solutions) come back to the CPU.
    let input = this.emptyStorage(this.maxChains * CHAIN_BYTES);
    let output = this.emptyStorage(this.maxChains * CHAIN_BYTES);
    this.device.queue.writeBuffer(input, 0, this.initOneWordChains(validWords));
    let chainCount = n;
    let truncated = false;
    const solutions: Solution[] = [];

    for (let pass = 0; pass < numWords - 1 && chainCount > 0; pass++) {
      const result = await this.extend(pipeline, {
        wordBuffer,
        chainBuf: input,
        chainCount,
        nextBuf: output,
        solBuf,
        countsBuf,
        wordCount: n,
        targetMask: allCoveredMask,
        maxWords: numWords,
      });

      truncated ||= result.truncated;
      solutions.push(...result.solutions);
      if (solutions.length > 0) {
        console.log(`[GPU] Pass ${pass + 1}: found ${result.solutions.length} solutions`);
        break;
      }
      console.log(`[GPU] Pass ${pass + 1}: ${result.nextCount} incomplete chains`);

      chainCount = result.nextCount;
      [input, output] = [output, input];
    }

    for (const buf of [wordBuffer, solBuf, countsBuf, input, output]) buf.destroy();
    return { ...this.selectBest(solutions, validWords), truncated };
  }

  private createPipeline(): GPUComputePipeline {
    const module = this.device.createShaderModule({ code: shaderSource });
    return this.device.createComputePipeline({
      layout: "auto",
      compute: {
        module,
        entryPoint: "extendChains",
        constants: { WORKGROUP_SIZE: this.workgroupSize },
      },
    });
  }

  private createWordBuffer(validWords: ValidWord[]): GPUBuffer {
    const data = new Uint32Array(validWords.length * 4);
    for (let i = 0; i < validWords.length; i++) {
      const w = validWords[i];
      data[i * 4 + 0] = w.coverageMask;
      data[i * 4 + 1] = w.firstLetterIdx;
      data[i * 4 + 2] = w.lastLetterIdx;
      data[i * 4 + 3] = w.word.length;
    }
    return this.uploadStorage(data);
  }

  private initOneWordChains(validWords: ValidWord[]): Uint32Array {
    const n = validWords.length;
    const chains = new Uint32Array(n * CHAIN_STRIDE);
    for (let i = 0; i < n; i++) {
      const off = i * CHAIN_STRIDE;
      chains[off + 0] = i; // word 0
      // words 1..4 stay 0 (unused: wordCount = 1)
      chains[off + 5] = validWords[i].coverageMask;
      chains[off + 6] = i; // lastWordIdx
      chains[off + 7] = 1; // wordCount
      chains[off + 8] = validWords[i].word.length; // totalChars
    }
    return chains;
  }

  private async extend(
    pipeline: GPUComputePipeline,
    p: {
      wordBuffer: GPUBuffer;
      chainBuf: GPUBuffer;
      chainCount: number;
      nextBuf: GPUBuffer;
      solBuf: GPUBuffer;
      countsBuf: GPUBuffer;
      wordCount: number;
      targetMask: number;
      maxWords: number;
    },
  ): Promise<PassResult> {
    const uniformBuf = this.uploadUniform(
      new Uint32Array([p.chainCount, p.wordCount, p.targetMask, p.maxWords]),
    );
    this.device.queue.writeBuffer(p.countsBuf, 0, new Uint32Array([0, 0]));

    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: p.wordBuffer } },
        { binding: 1, resource: { buffer: p.chainBuf } },
        { binding: 2, resource: { buffer: uniformBuf } },
        { binding: 3, resource: { buffer: p.solBuf } },
        { binding: 4, resource: { buffer: p.nextBuf } },
        { binding: 5, resource: { buffer: p.countsBuf } },
      ],
    });

    const maxWgPerDim = this.device.limits.maxComputeWorkgroupsPerDimension;
    const totalWg = Math.ceil((p.chainCount * p.wordCount) / this.workgroupSize);
    const wgX = Math.min(totalWg, maxWgPerDim);
    const wgY = Math.ceil(totalWg / maxWgPerDim);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(wgX, wgY);
    pass.end();
    this.device.queue.submit([encoder.finish()]);

    // Each readback costs a round trip, so the counts and the whole solutions buffer
    // come back in one copy.
    const data = await this.readBack([
      [p.countsBuf, 8],
      [p.solBuf, this.maxSolutions * CHAIN_BYTES],
    ]);
    uniformBuf.destroy();

    const [rawSolCount, rawNextCount] = data;
    const solCount = Math.min(rawSolCount, this.maxSolutions);
    const nextCount = Math.min(rawNextCount, this.maxChains);

    if (rawSolCount > this.maxSolutions) {
      console.warn(
        `[GPU] dropped ${rawSolCount - this.maxSolutions} solutions (cap ${this.maxSolutions})`,
      );
    }
    if (rawNextCount > this.maxChains) {
      console.warn(`[GPU] dropped ${rawNextCount - this.maxChains} chains (cap ${this.maxChains})`);
    }

    const solutions: Solution[] = [];
    for (let i = 0; i < solCount; i++) {
      const off = 2 + i * CHAIN_STRIDE;
      const wc = data[off + 7];
      const wordIndices: number[] = [];
      for (let j = 0; j < wc; j++) wordIndices.push(data[off + j]);
      solutions.push({ words: wordIndices, totalChars: data[off + 8] });
    }

    const truncated = rawSolCount > this.maxSolutions || rawNextCount > this.maxChains;
    return { solutions, nextCount, truncated };
  }

  private uploadStorage(data: Uint32Array): GPUBuffer {
    const buf = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buf, 0, data);
    return buf;
  }

  private uploadUniform(data: Uint32Array): GPUBuffer {
    const buf = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buf, 0, data);
    return buf;
  }

  private emptyStorage(byteSize: number): GPUBuffer {
    return this.device.createBuffer({
      size: byteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
  }

  private counterBuffer(): GPUBuffer {
    return this.device.createBuffer({
      size: 8,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
  }

  /** Copies each [buffer, byteSize] into one staging buffer and maps it once. */
  private async readBack(parts: [GPUBuffer, number][]): Promise<Uint32Array> {
    const total = parts.reduce((sum, [, size]) => sum + size, 0);
    const staging = this.device.createBuffer({
      size: total,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    const encoder = this.device.createCommandEncoder();
    let offset = 0;
    for (const [src, size] of parts) {
      encoder.copyBufferToBuffer(src, 0, staging, offset, size);
      offset += size;
    }
    this.device.queue.submit([encoder.finish()]);
    await staging.mapAsync(GPUMapMode.READ);
    const out = new Uint32Array(total / 4);
    out.set(new Uint32Array(staging.getMappedRange()));
    staging.unmap();
    staging.destroy();
    return out;
  }

  private selectBest(
    solutions: Solution[],
    validWords: ValidWord[],
  ): { success: boolean; data: string[] } {
    if (solutions.length === 0) return { success: false, data: [] };

    const toWords = (sol: Solution) => sol.words.map((i) => validWords[i].word);

    let best = solutions[0];
    let bestStr = toWords(best).join("");
    for (let i = 1; i < solutions.length; i++) {
      const sol = solutions[i];
      const str = toWords(sol).join("");
      if (
        sol.totalChars < best.totalChars ||
        (sol.totalChars === best.totalChars && str < bestStr)
      ) {
        best = sol;
        bestStr = str;
      }
    }

    return { success: true, data: toWords(best) };
  }
}
