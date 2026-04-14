(function(){function e(e){return e.charCodeAt(0)-65}function t(t,n){return t.letterIndex[e(n)]}function n(t,n){return t.letterBit[e(n)]}function r(t){let n=[],r=new Int8Array(26).fill(-1),i=new Int32Array(26).fill(0),a=new Int8Array(12).fill(-1);for(let o=0;o<t.length;o++)for(let s=0;s<t[o].length;s++){let c=t[o][s].toUpperCase(),l=n.length,u=e(c);n.push(c),r[u]=l,i[u]=1<<l,a[l]=o}return{sides:t,letters:n,letterIndex:r,letterBit:i,sideOf:a,allCoveredMask:(1<<n.length)-1}}let i=null;var a=class e{constructor(){this.contents=new Map}static async load(t){if(i)return i;let n=new e,r=await(await fetch(t)).text();for(let e of r.split(`
`)){let t=e.trim();t.length>0&&n.add(t)}return i=n,n}add(e){let t=``;for(let n=0;n<e.length;n++)t+=e.charAt(n),this.contents.has(t)||this.contents.set(t,!1);this.contents.set(t,!0)}hasString(e){return e?this.contents.has(e.toLowerCase()):!1}hasFullWord(e){if(!e)return!1;let t=e.toLowerCase();return this.contents.has(t)&&this.contents.get(t)}getValidWords(e){let n=[];for(let[r,i]of this.contents){if(!i||r.length<3)continue;let a=r.toUpperCase(),o=!0,s=0;for(let n=0;n<a.length;n++){let r=t(e,a[n]);if(r<0){o=!1;break}if(s|=1<<r,n>0){let i=t(e,a[n-1]);if(e.sideOf[r]===e.sideOf[i]){o=!1;break}}}if(!o)continue;let c=t(e,a[0]),l=t(e,a[a.length-1]);n.push({word:a,coverageMask:s,firstLetterIdx:c,lastLetterIdx:l})}return n}},o=`struct WordData {
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
`;let s=8192,c=2e5,l=4294967295;var u=class e{constructor(e){this.device=e}static async isAvailable(){if(typeof navigator>`u`||!navigator.gpu)return!1;try{let e=await navigator.gpu.requestAdapter();return e?((await e.requestDevice()).destroy(),!0):!1}catch{return!1}}static async create(){if(typeof navigator>`u`||!navigator.gpu)return null;try{let t=await navigator.gpu.requestAdapter();return t?new e(await t.requestDevice()):null}catch{return null}}async findBest(e,t,n){let r=e.length;if(r===0)return{success:!1,data:[]};let i=this.device.createShaderModule({code:o}),a=this.device.createComputePipeline({layout:`auto`,compute:{module:i,entryPoint:`extendChains`}}),s=new ArrayBuffer(r*16),c=new DataView(s);for(let t=0;t<r;t++){let n=e[t];c.setUint32(t*16+0,n.coverageMask,!0),c.setUint32(t*16+4,n.firstLetterIdx,!0),c.setUint32(t*16+8,n.lastLetterIdx,!0),c.setUint32(t*16+12,n.word.length,!0)}let u=this.createStorageBuffer(s,!0),d=new Uint32Array(r*10);for(let t=0;t<r;t++){let n=t*10;d[n+0]=t,d[n+1]=l,d[n+2]=l,d[n+3]=l,d[n+4]=l,d[n+5]=e[t].coverageMask,d[n+6]=t,d[n+7]=1,d[n+8]=e[t].word.length,d[n+9]=0}let f=[],p=d,m=r;for(let e=0;e<t-1&&m!==0;e++){let i=await this.runExtendPass(a,u,p,m,r,n,t);for(let e of i.solutions)f.push(e);if(f.length>0)break;p=i.nextChains,m=i.nextChainCount,console.log(`[GPU] Pass ${e+1}: ${m} incomplete chains, ${f.length} solutions`)}return u.destroy(),f.length===0?{success:!1,data:[]}:this.selectBestSolution(f,e)}async runExtendPass(e,t,n,r,i,a,o){let u=r*10*4,d=new Uint8Array(n.buffer,0,u),f=this.createStorageBuffer(d,!0),p=new Uint32Array([r,i,a,o]),m=this.device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});this.device.queue.writeBuffer(m,0,p);let h=this.device.createBuffer({size:s*10*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),g=this.createCounterBuffer(),_=this.device.createBuffer({size:c*10*4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC}),v=this.createCounterBuffer(),y=this.device.createBindGroup({layout:e.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:1,resource:{buffer:f}},{binding:2,resource:{buffer:m}},{binding:3,resource:{buffer:h}},{binding:4,resource:{buffer:g}},{binding:5,resource:{buffer:_}},{binding:6,resource:{buffer:v}}]}),b=r*i,x=Math.ceil(b/256),S=65535,C=Math.min(x,S),w=Math.ceil(x/S),T=this.device.createCommandEncoder(),E=T.beginComputePass();E.setPipeline(e),E.setBindGroup(0,y),E.dispatchWorkgroups(C,w),E.end();let D=this.createStagingBuffer(4);T.copyBufferToBuffer(g,0,D,0,4);let O=this.createStagingBuffer(4);T.copyBufferToBuffer(v,0,O,0,4),this.device.queue.submit([T.finish()]),await D.mapAsync(GPUMapMode.READ);let k=Math.min(new Uint32Array(D.getMappedRange())[0],s);D.unmap(),await O.mapAsync(GPUMapMode.READ);let A=Math.min(new Uint32Array(O.getMappedRange())[0],c);O.unmap();let j=[];if(k>0){let e=k*10*4,t=this.createStagingBuffer(e),n=this.device.createCommandEncoder();n.copyBufferToBuffer(h,0,t,0,e),this.device.queue.submit([n.finish()]),await t.mapAsync(GPUMapMode.READ);let r=new Uint32Array(t.getMappedRange());for(let e=0;e<k;e++){let t=e*10,n=[];for(let e=0;e<5;e++){let i=r[t+e];i!==l&&n.push(i)}j.push({words:n,totalChars:r[t+8]})}t.unmap(),t.destroy()}let M=new Uint32Array;if(A>0){let e=A*10*4,t=this.createStagingBuffer(e),n=this.device.createCommandEncoder();n.copyBufferToBuffer(_,0,t,0,e),this.device.queue.submit([n.finish()]),await t.mapAsync(GPUMapMode.READ);let r=t.getMappedRange();M=new Uint32Array(r.byteLength/4),M.set(new Uint32Array(r)),t.unmap(),t.destroy()}return f.destroy(),m.destroy(),h.destroy(),g.destroy(),_.destroy(),v.destroy(),D.destroy(),O.destroy(),{solutions:j,nextChains:M,nextChainCount:A}}selectBestSolution(e,t){let n=null,r=``;for(let i of e){let e=i.words.map(e=>t[e].word).join(``);(!n||i.totalChars<n.totalChars||i.totalChars===n.totalChars&&e<r)&&(n=i,r=e)}return n?{success:!0,data:n.words.map(e=>t[e].word)}:{success:!1,data:[]}}createStorageBuffer(e,t){let n=e.byteLength,r=GPUBufferUsage.STORAGE|(t?GPUBufferUsage.COPY_DST:GPUBufferUsage.COPY_SRC),i=this.device.createBuffer({size:n,usage:r});return this.device.queue.writeBuffer(i,0,e),i}createCounterBuffer(){let e=this.device.createBuffer({size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(e,0,new Uint32Array([0])),e}createStagingBuffer(e){return this.device.createBuffer({size:e,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST})}destroy(){this.device.destroy()}},d=class{constructor(e,t){this.ctx=e,this.dictionary=t,this.words=Array.from({length:5},()=>``),this.wordCoverage=[,,,,,].fill(0),this.solvingProcess=[],this.bestSolution=null}allLettersUsed(){let e=0;for(let t of this.wordCoverage)e|=t;return e===this.ctx.allCoveredMask}onSameSide(e,t){return this.ctx.sideOf[e]===this.ctx.sideOf[t]}addLetter(e,t){this.words[t]+=e,this.wordCoverage[t]|=n(this.ctx,e)}removeLetter(e){let t=this.words[e];this.words[e]=t.substring(0,t.length-1);let r=0;for(let t of this.words[e])r|=n(this.ctx,t);this.wordCoverage[e]=r}lastLetter(e){let t=this.words[e];return t[t.length-1]}alreadyUsed(e){return this.words.some(t=>t===e)}isValid(e,n,r){if(n===0&&r===0)return!0;if(n>=1&&r===0)return e===this.lastLetter(n-1);let i=this.words[n],a=i+e,o=t(this.ctx,e),s=t(this.ctx,i[i.length-1]);return!this.onSameSide(o,s)&&!this.alreadyUsed(a)&&this.dictionary.hasString(a)}solveRB(e,t,n){if(this.allLettersUsed()&&this.dictionary.hasFullWord(this.words[e])&&this.words[e].length>=3)return!0;if(e>=n)return!1;for(let r of this.ctx.letters)if(this.isValid(r,e,t)){if(this.addLetter(r,e),this.solveRB(e,t+1,n))return!0;let i=this.words[e];if(i.length>=3&&this.dictionary.hasFullWord(i)&&(this.solvingProcess.push(this.words.filter(e=>e!==``)),this.solveRB(e+1,0,n)))return!0;this.removeLetter(e)}return!1}solve(){let e=1;for(;e<=5;){if(this.solveRB(0,0,e))return this.solvingProcess.push(this.words.filter(e=>e!==``)),{success:!0,data:this.solvingProcess};e++}let t=this.solvingProcess.reduce((e,t)=>e.length>t.length?e:t,[]);return this.solvingProcess.push(t),{success:!1,data:this.solvingProcess}}static findBestCPU(e,t,n){let r=null,i=1/0,a=e=>{let t=e.reduce((e,t)=>e+t.length,0);return t<i?!0:t===i&&r?e.join(``).localeCompare(r.join(``))<0:!1},o=new Map;for(let t of e){let e=o.get(t.firstLetterIdx)??[];e.push(t),o.set(t.firstLetterIdx,e)}if(t>=1)for(let t of e)t.coverageMask===n&&(!r||a([t.word]))&&(r=[t.word],i=t.word.length);if(t>=2)for(let t of e){let e=o.get(t.lastLetterIdx);if(e){for(let o of e)if(t.word!==o.word&&(t.coverageMask|o.coverageMask)===n){let e=[t.word,o.word];(!r||a(e))&&(r=e,i=t.word.length+o.word.length)}}}if(t>=3&&!r)for(let t of e){let e=o.get(t.lastLetterIdx);if(e)for(let s of e){if(t.word===s.word)continue;let e=t.coverageMask|s.coverageMask;if(e===n){let e=[t.word,s.word];(!r||a(e))&&(r=e,i=t.word.length+s.word.length);continue}let c=o.get(s.lastLetterIdx);if(c){for(let o of c)if(!(o.word===t.word||o.word===s.word)&&(e|o.coverageMask)===n){let e=[t.word,s.word,o.word];(!r||a(e))&&(r=e,i=t.word.length+s.word.length+o.word.length)}}}}return t>=4&&!r?{success:!1,data:[]}:{success:r!==null,data:r??[]}}findBestBacktracking(e){return this.bestSolution=null,this.words=Array.from({length:5},()=>``),this.wordCoverage=[,,,,,].fill(0),this.solveRBFull(0,0,e),{success:this.bestSolution!==null,data:this.bestSolution??[]}}solveRBFull(e,t,n){let r=0;if(this.allLettersUsed()&&this.dictionary.hasFullWord(this.words[e])&&this.words[e].length>=3){let e=this.words.filter(e=>e!==``);return(!this.bestSolution||this.isBetterSolution(e,this.bestSolution))&&(this.bestSolution=[...e]),1}if(e>=n)return 0;for(let i of this.ctx.letters)if(this.isValid(i,e,t)){this.addLetter(i,e),r+=this.solveRBFull(e,t+1,n);let a=this.words[e];a.length>=3&&this.dictionary.hasFullWord(a)&&(r+=this.solveRBFull(e+1,0,n)),this.removeLetter(e)}return r}isBetterSolution(e,t){let n=e.join(``),r=t.join(``);return n.length<r.length||n.length===r.length&&n.localeCompare(r)<0}};let f;async function p(){return f===void 0?(f=await u.create(),console.log(f?`[Solver] Using WebGPU for findBest`:`[Solver] WebGPU not available, using CPU fallback`),f):f}async function m(e){let t=performance.now(),n=await a.load(`/letter-boxed/word_list.txt`),i=performance.now()-t,o=r(e.sides),s=performance.now(),c=n.getValidWords(o),l=performance.now()-s;if(console.log(`[Solver] ${c.length} valid words (dict: ${i.toFixed(1)}ms, filter: ${l.toFixed(1)}ms)`),e.type===`solve`){let e=new d(o,n),t=performance.now(),r=e.solve(),i=performance.now()-t;return console.log(`[Solver] solve() completed in ${i.toFixed(1)}ms (CPU backtracking)`),{type:`solveResult`,...r}}let u=await p();if(u)try{let t=performance.now(),n=await u.findBest(c,e.numWords,o.allCoveredMask),r=performance.now()-t;if(console.log(`[Solver] findBest() GPU completed in ${r.toFixed(1)}ms`),n.success)return{type:`findBestResult`,...n};console.log(`[Solver] GPU found no solution, falling back to CPU`)}catch(e){console.warn(`[Solver] GPU findBest failed, falling back to CPU:`,e)}let f=performance.now(),m=d.findBestCPU(c,e.numWords,o.allCoveredMask),h=performance.now()-f;if(console.log(`[Solver] findBest() CPU word-level completed in ${h.toFixed(1)}ms`),m.success)return{type:`findBestResult`,...m};let g=performance.now(),_=new d(o,n).findBestBacktracking(e.numWords),v=performance.now()-g;return console.log(`[Solver] findBest() CPU backtracking completed in ${v.toFixed(1)}ms`),{type:`findBestResult`,..._}}self.onmessage=async e=>{try{let t=performance.now(),n=await m(e.data),r=performance.now()-t;console.log(`[Solver] Total worker time: ${r.toFixed(1)}ms`),self.postMessage(n)}catch(e){let t=e instanceof Error?e.message:String(e);self.postMessage({type:`error`,message:t})}}})();