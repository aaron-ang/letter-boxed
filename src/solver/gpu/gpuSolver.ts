import type { ValidWord } from "@/solver/types";
import shaderSource from "./wordCoverage.wgsl?raw";

// Chain layout: [w0, w1, w2, w3, w4, coverageMask, lastWordIdx, wordCount, totalChars]
const CHAIN_STRIDE = 9;
const CHAIN_BYTES = CHAIN_STRIDE * 4;
const WORKGROUP_SIZE = 256;

interface Solution {
  words: number[];
  totalChars: number;
}

interface ExtendResult {
  solutions: Solution[];
  nextChains: Uint32Array;
}

export class GPUSolver {
  private device: GPUDevice;
  private maxSolutions: number;
  private maxChains: number;

  private constructor(device: GPUDevice) {
    this.device = device;
    const cap = device.limits.maxStorageBufferBindingSize;
    this.maxSolutions = Math.min(Math.floor((cap * 0.05) / CHAIN_BYTES), 65_536);
    this.maxChains = Math.floor((cap * 0.5) / CHAIN_BYTES);
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
  ): Promise<{ success: boolean; data: string[] }> {
    const n = validWords.length;
    if (n === 0) return { success: false, data: [] };

    const pipeline = this.createPipeline();
    const wordBuffer = this.createWordBuffer(validWords);

    let chains = this.initOneWordChains(validWords);
    const solutions: Solution[] = [];

    for (let pass = 0; pass < numWords - 1; pass++) {
      const chainCount = chains.length / CHAIN_STRIDE;
      if (chainCount === 0) break;

      const result = await this.extend(
        pipeline,
        wordBuffer,
        chains,
        chainCount,
        n,
        allCoveredMask,
        numWords,
      );

      solutions.push(...result.solutions);
      if (solutions.length > 0) {
        console.log(`[GPU] Pass ${pass + 1}: found ${result.solutions.length} solutions`);
      } else {
        console.log(
          `[GPU] Pass ${pass + 1}: ${result.nextChains.length / CHAIN_STRIDE} incomplete chains`,
        );
      }

      if (solutions.length > 0) break;
      chains = result.nextChains;
    }

    wordBuffer.destroy();
    return this.selectBest(solutions, validWords);
  }

  private createPipeline(): GPUComputePipeline {
    const module = this.device.createShaderModule({ code: shaderSource });
    return this.device.createComputePipeline({
      layout: "auto",
      compute: { module, entryPoint: "extendChains" },
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
    wordBuffer: GPUBuffer,
    chains: Uint32Array,
    chainCount: number,
    wordCount: number,
    targetMask: number,
    maxWords: number,
  ): Promise<ExtendResult> {
    const chainBuf = this.uploadStorage(chains.subarray(0, chainCount * CHAIN_STRIDE));
    const uniformBuf = this.uploadUniform(
      new Uint32Array([chainCount, wordCount, targetMask, maxWords]),
    );
    const solBuf = this.emptyStorage(this.maxSolutions * CHAIN_BYTES);
    const solCountBuf = this.counterBuffer();
    const nextBuf = this.emptyStorage(this.maxChains * CHAIN_BYTES);
    const nextCountBuf = this.counterBuffer();

    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: wordBuffer } },
        { binding: 1, resource: { buffer: chainBuf } },
        { binding: 2, resource: { buffer: uniformBuf } },
        { binding: 3, resource: { buffer: solBuf } },
        { binding: 4, resource: { buffer: solCountBuf } },
        { binding: 5, resource: { buffer: nextBuf } },
        { binding: 6, resource: { buffer: nextCountBuf } },
      ],
    });

    const maxWgPerDim = this.device.limits.maxComputeWorkgroupsPerDimension;
    const totalWg = Math.ceil((chainCount * wordCount) / WORKGROUP_SIZE);
    const wgX = Math.min(totalWg, maxWgPerDim);
    const wgY = Math.ceil(totalWg / maxWgPerDim);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(wgX, wgY);
    pass.end();
    this.device.queue.submit([encoder.finish()]);

    const rawSolCount = (await this.readBuffer(solCountBuf, 4))[0];
    const rawNextCount = (await this.readBuffer(nextCountBuf, 4))[0];
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
    if (solCount > 0) {
      const data = await this.readBuffer(solBuf, solCount * CHAIN_STRIDE * 4);
      for (let i = 0; i < solCount; i++) {
        const off = i * CHAIN_STRIDE;
        const wc = data[off + 7];
        const wordIndices: number[] = [];
        for (let j = 0; j < wc; j++) wordIndices.push(data[off + j]);
        solutions.push({ words: wordIndices, totalChars: data[off + 8] });
      }
    }

    const nextChains =
      nextCount > 0
        ? await this.readBuffer(nextBuf, nextCount * CHAIN_STRIDE * 4)
        : new Uint32Array(0);

    for (const b of [chainBuf, uniformBuf, solBuf, solCountBuf, nextBuf, nextCountBuf]) {
      b.destroy();
    }

    return { solutions, nextChains };
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
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
  }

  private counterBuffer(): GPUBuffer {
    const buf = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buf, 0, new Uint32Array([0]));
    return buf;
  }

  private async readBuffer(src: GPUBuffer, byteSize: number): Promise<Uint32Array> {
    const staging = this.device.createBuffer({
      size: byteSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(src, 0, staging, 0, byteSize);
    this.device.queue.submit([encoder.finish()]);
    await staging.mapAsync(GPUMapMode.READ);
    const mapped = staging.getMappedRange();
    const out = new Uint32Array(mapped.byteLength / 4);
    out.set(new Uint32Array(mapped));
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
