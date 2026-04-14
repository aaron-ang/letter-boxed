import type { ValidWord } from "../types";
// @ts-expect-error — WGSL loaded as raw string via raw-loader
import shaderSource from "./wordCoverage.wgsl";

const WORKGROUP_SIZE = 256;
const CHAIN_STRIDE = 10; // 10 u32s per Chain struct (40 bytes)
const MAX_SOLUTIONS = 8192;
const MAX_CHAINS = 200_000;
const SENTINEL = 0xffffffff;

export class GPUSolver {
  private device: GPUDevice;

  private constructor(device: GPUDevice) {
    this.device = device;
  }

  static async isAvailable(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return false;
      const device = await adapter.requestDevice();
      device.destroy();
      return true;
    } catch {
      return false;
    }
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

    const shaderModule = this.device.createShaderModule({ code: shaderSource as string });

    const pipeline = this.device.createComputePipeline({
      layout: "auto",
      compute: { module: shaderModule, entryPoint: "extendChains" },
    });

    // Upload word data (16 bytes per word)
    const wordData = new ArrayBuffer(n * 16);
    const wordView = new DataView(wordData);
    for (let i = 0; i < n; i++) {
      const w = validWords[i];
      wordView.setUint32(i * 16 + 0, w.coverageMask, true);
      wordView.setUint32(i * 16 + 4, w.firstLetterIdx, true);
      wordView.setUint32(i * 16 + 8, w.lastLetterIdx, true);
      wordView.setUint32(i * 16 + 12, w.word.length, true);
    }
    const wordBuffer = this.createStorageBuffer(wordData, true);

    // Initialize 1-word chains (one per valid word)
    const initChains = new Uint32Array(n * CHAIN_STRIDE);
    for (let i = 0; i < n; i++) {
      const off = i * CHAIN_STRIDE;
      initChains[off + 0] = i; // word0
      initChains[off + 1] = SENTINEL; // word1
      initChains[off + 2] = SENTINEL; // word2
      initChains[off + 3] = SENTINEL; // word3
      initChains[off + 4] = SENTINEL; // word4
      initChains[off + 5] = validWords[i].coverageMask;
      initChains[off + 6] = i; // lastWordIdx
      initChains[off + 7] = 1; // wordCount
      initChains[off + 8] = validWords[i].word.length; // totalChars
      initChains[off + 9] = 0; // _pad
    }

    const allSolutions: Array<{ words: number[]; totalChars: number }> = [];
    let currentChains: Uint32Array = initChains;
    let chainCount = n;

    // Multi-pass: extend chains from 1-word → 2-word → ... → numWords
    for (let pass = 0; pass < numWords - 1; pass++) {
      if (chainCount === 0) break;

      const result = await this.runExtendPass(
        pipeline,
        wordBuffer,
        currentChains,
        chainCount,
        n,
        allCoveredMask,
        numWords,
      );

      // Collect solutions from this pass
      for (const sol of result.solutions) {
        allSolutions.push(sol);
      }

      // If we found solutions, no need to search longer chains
      if (allSolutions.length > 0) break;

      currentChains = result.nextChains;
      chainCount = result.nextChainCount;

      console.log(
        `[GPU] Pass ${pass + 1}: ${chainCount} incomplete chains, ${allSolutions.length} solutions`,
      );
    }

    wordBuffer.destroy();

    if (allSolutions.length === 0) {
      return { success: false, data: [] };
    }

    return this.selectBestSolution(allSolutions, validWords);
  }

  private async runExtendPass(
    pipeline: GPUComputePipeline,
    wordBuffer: GPUBuffer,
    chains: Uint32Array,
    chainCount: number,
    wordCount: number,
    targetMask: number,
    maxWords: number,
  ): Promise<{
    solutions: Array<{ words: number[]; totalChars: number }>;
    nextChains: Uint32Array;
    nextChainCount: number;
  }> {
    const chainByteSize = chainCount * CHAIN_STRIDE * 4;
    const chainData = new Uint8Array(chains.buffer, 0, chainByteSize);
    const chainBuffer = this.createStorageBuffer(chainData, true);

    const uniformData = new Uint32Array([chainCount, wordCount, targetMask, maxWords]);
    const uniformBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    const solutionBuffer = this.device.createBuffer({
      size: MAX_SOLUTIONS * CHAIN_STRIDE * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const solutionCountBuffer = this.createCounterBuffer();

    const nextChainBuffer = this.device.createBuffer({
      size: MAX_CHAINS * CHAIN_STRIDE * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    const nextChainCountBuffer = this.createCounterBuffer();

    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: wordBuffer } },
        { binding: 1, resource: { buffer: chainBuffer } },
        { binding: 2, resource: { buffer: uniformBuffer } },
        { binding: 3, resource: { buffer: solutionBuffer } },
        { binding: 4, resource: { buffer: solutionCountBuffer } },
        { binding: 5, resource: { buffer: nextChainBuffer } },
        { binding: 6, resource: { buffer: nextChainCountBuffer } },
      ],
    });

    const totalWork = chainCount * wordCount;
    const totalWorkgroups = Math.ceil(totalWork / WORKGROUP_SIZE);
    const MAX_WG = 65535;
    const wgX = Math.min(totalWorkgroups, MAX_WG);
    const wgY = Math.ceil(totalWorkgroups / MAX_WG);

    const encoder = this.device.createCommandEncoder();
    const computePass = encoder.beginComputePass();
    computePass.setPipeline(pipeline);
    computePass.setBindGroup(0, bindGroup);
    computePass.dispatchWorkgroups(wgX, wgY);
    computePass.end();

    // Staging buffers for readback
    const solCountStaging = this.createStagingBuffer(4);
    encoder.copyBufferToBuffer(solutionCountBuffer, 0, solCountStaging, 0, 4);

    const nextCountStaging = this.createStagingBuffer(4);
    encoder.copyBufferToBuffer(nextChainCountBuffer, 0, nextCountStaging, 0, 4);

    this.device.queue.submit([encoder.finish()]);

    // Read solution count
    await solCountStaging.mapAsync(GPUMapMode.READ);
    const solCount = Math.min(new Uint32Array(solCountStaging.getMappedRange())[0], MAX_SOLUTIONS);
    solCountStaging.unmap();

    // Read next chain count
    await nextCountStaging.mapAsync(GPUMapMode.READ);
    const nextCount = Math.min(new Uint32Array(nextCountStaging.getMappedRange())[0], MAX_CHAINS);
    nextCountStaging.unmap();

    // Read solutions
    const solutions: Array<{ words: number[]; totalChars: number }> = [];
    if (solCount > 0) {
      const readSize = solCount * CHAIN_STRIDE * 4;
      const solStaging = this.createStagingBuffer(readSize);
      const enc2 = this.device.createCommandEncoder();
      enc2.copyBufferToBuffer(solutionBuffer, 0, solStaging, 0, readSize);
      this.device.queue.submit([enc2.finish()]);
      await solStaging.mapAsync(GPUMapMode.READ);
      const data = new Uint32Array(solStaging.getMappedRange());
      for (let i = 0; i < solCount; i++) {
        const off = i * CHAIN_STRIDE;
        const words: number[] = [];
        for (let j = 0; j < 5; j++) {
          const idx = data[off + j];
          if (idx !== SENTINEL) words.push(idx);
        }
        solutions.push({ words, totalChars: data[off + 8] });
      }
      solStaging.unmap();
      solStaging.destroy();
    }

    // Read next chains
    let nextChains: Uint32Array = new Uint32Array(0);
    if (nextCount > 0) {
      const readSize = nextCount * CHAIN_STRIDE * 4;
      const nextStaging = this.createStagingBuffer(readSize);
      const enc3 = this.device.createCommandEncoder();
      enc3.copyBufferToBuffer(nextChainBuffer, 0, nextStaging, 0, readSize);
      this.device.queue.submit([enc3.finish()]);
      await nextStaging.mapAsync(GPUMapMode.READ);
      const mapped = nextStaging.getMappedRange();
      nextChains = new Uint32Array(mapped.byteLength / 4);
      nextChains.set(new Uint32Array(mapped));
      nextStaging.unmap();
      nextStaging.destroy();
    }

    chainBuffer.destroy();
    uniformBuffer.destroy();
    solutionBuffer.destroy();
    solutionCountBuffer.destroy();
    nextChainBuffer.destroy();
    nextChainCountBuffer.destroy();
    solCountStaging.destroy();
    nextCountStaging.destroy();

    return { solutions, nextChains, nextChainCount: nextCount };
  }

  private selectBestSolution(
    solutions: Array<{ words: number[]; totalChars: number }>,
    validWords: ValidWord[],
  ): { success: boolean; data: string[] } {
    let best: (typeof solutions)[0] | null = null;
    let bestStr = "";
    for (const sol of solutions) {
      const str = sol.words.map((i) => validWords[i].word).join("");
      if (
        !best ||
        sol.totalChars < best.totalChars ||
        (sol.totalChars === best.totalChars && str < bestStr)
      ) {
        best = sol;
        bestStr = str;
      }
    }
    if (!best) return { success: false, data: [] };
    return { success: true, data: best.words.map((i) => validWords[i].word) };
  }

  private createStorageBuffer(data: AllowSharedBufferSource, writable: boolean): GPUBuffer {
    const byteLength = ArrayBuffer.isView(data) ? data.byteLength : data.byteLength;
    const usage =
      GPUBufferUsage.STORAGE | (writable ? GPUBufferUsage.COPY_DST : GPUBufferUsage.COPY_SRC);
    const buffer = this.device.createBuffer({ size: byteLength, usage });
    this.device.queue.writeBuffer(buffer, 0, data as AllowSharedBufferSource);
    return buffer;
  }

  private createCounterBuffer(): GPUBuffer {
    const buffer = this.device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(buffer, 0, new Uint32Array([0]));
    return buffer;
  }

  private createStagingBuffer(size: number): GPUBuffer {
    return this.device.createBuffer({
      size,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
  }

  destroy(): void {
    this.device.destroy();
  }
}
