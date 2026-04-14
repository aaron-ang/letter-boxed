struct WordData {
  coverageMask: u32,
  firstLetterIdx: u32,
  lastLetterIdx: u32,
  charCount: u32,
};

struct Chain {
  word0: u32,
  word1: u32,
  word2: u32,
  word3: u32,
  word4: u32,
  coverageMask: u32,
  lastWordIdx: u32,
  wordCount: u32,
  totalChars: u32,
  _pad: u32,
};

struct Uniforms {
  chainCount: u32,
  wordCount: u32,
  targetMask: u32,
  maxWords: u32,
};

@group(0) @binding(0) var<storage, read> words: array<WordData>;
@group(0) @binding(1) var<storage, read> chains: array<Chain>;
@group(0) @binding(2) var<uniform> uniforms: Uniforms;
@group(0) @binding(3) var<storage, read_write> solutions: array<Chain>;
@group(0) @binding(4) var<storage, read_write> solutionCount: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read_write> nextChains: array<Chain>;
@group(0) @binding(6) var<storage, read_write> nextChainCount: array<atomic<u32>>;

@compute @workgroup_size(256)
fn extendChains(@builtin(global_invocation_id) gid: vec3<u32>, @builtin(num_workgroups) nwg: vec3<u32>) {
  // 2D dispatch: linear index = y * (wgX * 256) + x
  let idx = gid.y * (nwg.x * 256u) + gid.x;
  let totalWork = uniforms.chainCount * uniforms.wordCount;

  if (idx >= totalWork) {
    return;
  }

  let chainIdx = idx / uniforms.wordCount;
  let wordIdx = idx % uniforms.wordCount;

  let chain = chains[chainIdx];
  let newWord = words[wordIdx];
  let lastWord = words[chain.lastWordIdx];

  // Chain constraint: last letter of chain == first letter of new word
  if (lastWord.lastLetterIdx != newWord.firstLetterIdx) {
    return;
  }

  // No duplicate words
  if (wordIdx == chain.word0 || wordIdx == chain.word1 ||
      wordIdx == chain.word2 || wordIdx == chain.word3 || wordIdx == chain.word4) {
    return;
  }

  let newCoverage = chain.coverageMask | newWord.coverageMask;
  let newWordCount = chain.wordCount + 1u;
  let newTotalChars = chain.totalChars + newWord.charCount;

  // Build new chain entry
  var nc: Chain;
  nc.word0 = chain.word0;
  nc.word1 = chain.word1;
  nc.word2 = chain.word2;
  nc.word3 = chain.word3;
  nc.word4 = chain.word4;
  nc.coverageMask = newCoverage;
  nc.lastWordIdx = wordIdx;
  nc.wordCount = newWordCount;
  nc.totalChars = newTotalChars;
  nc._pad = 0u;

  // Place new word in the correct slot
  if (newWordCount == 2u) {
    nc.word1 = wordIdx;
  } else if (newWordCount == 3u) {
    nc.word2 = wordIdx;
  } else if (newWordCount == 4u) {
    nc.word3 = wordIdx;
  } else if (newWordCount == 5u) {
    nc.word4 = wordIdx;
  }

  if (newCoverage == uniforms.targetMask) {
    // Complete solution found
    let slot = atomicAdd(&solutionCount[0], 1u);
    if (slot < arrayLength(&solutions)) {
      solutions[slot] = nc;
    }
  } else if (newWordCount < uniforms.maxWords) {
    // Incomplete chain — pass to next round
    let slot = atomicAdd(&nextChainCount[0], 1u);
    if (slot < arrayLength(&nextChains)) {
      nextChains[slot] = nc;
    }
  }
}
