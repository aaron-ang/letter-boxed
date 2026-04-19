struct WordData {
  coverageMask: u32,
  firstLetterIdx: u32,
  lastLetterIdx: u32,
  charCount: u32,
};

struct Chain {
  words: array<u32, 5>,
  coverageMask: u32,
  lastWordIdx: u32,
  wordCount: u32,
  totalChars: u32,
};

struct Uniforms {
  chainCount: u32,
  wordCount: u32,
  targetMask: u32,
  maxWords: u32,
};

@group(0) @binding(0) var<storage, read>       words: array<WordData>;
@group(0) @binding(1) var<storage, read>       chains: array<Chain>;
@group(0) @binding(2) var<uniform>             uniforms: Uniforms;
@group(0) @binding(3) var<storage, read_write> solutions: array<Chain>;
@group(0) @binding(4) var<storage, read_write> solutionCount: atomic<u32>;
@group(0) @binding(5) var<storage, read_write> nextChains: array<Chain>;
@group(0) @binding(6) var<storage, read_write> nextChainCount: atomic<u32>;

@compute @workgroup_size(256)
fn extendChains(
  @builtin(global_invocation_id) gid: vec3<u32>,
  @builtin(num_workgroups) nwg: vec3<u32>,
) {
  // 2D dispatch flattened: idx = y * (wgX * 256) + x
  let idx = gid.y * (nwg.x * 256u) + gid.x;
  let totalWork = uniforms.chainCount * uniforms.wordCount;
  if (idx >= totalWork) { return; }

  let chainIdx = idx / uniforms.wordCount;
  let wordIdx = idx % uniforms.wordCount;

  let chain = chains[chainIdx];
  let newWord = words[wordIdx];
  let lastWord = words[chain.lastWordIdx];

  // Chain link: prev word's last letter must equal new word's first letter
  if (lastWord.lastLetterIdx != newWord.firstLetterIdx) { return; }

  // Reject duplicate word in chain
  for (var i = 0u; i < chain.wordCount; i++) {
    if (chain.words[i] == wordIdx) { return; }
  }

  var nc = chain;
  nc.words[chain.wordCount] = wordIdx;
  nc.coverageMask = chain.coverageMask | newWord.coverageMask;
  nc.lastWordIdx = wordIdx;
  nc.wordCount = chain.wordCount + 1u;
  nc.totalChars = chain.totalChars + newWord.charCount;

  if (nc.coverageMask == uniforms.targetMask) {
    let slot = atomicAdd(&solutionCount, 1u);
    if (slot < arrayLength(&solutions)) { solutions[slot] = nc; }
  } else if (nc.wordCount < uniforms.maxWords) {
    let slot = atomicAdd(&nextChainCount, 1u);
    if (slot < arrayLength(&nextChains)) { nextChains[slot] = nc; }
  }
}
