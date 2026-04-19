(function(){function e(e){return e.charCodeAt(0)-65}function t(t,n){return t.letterIndex[e(n)]}function n(t,n){return t.letterBit[e(n)]}function r(t){let n=[],r=new Int8Array(26).fill(-1),i=new Int32Array(26).fill(0),a=new Int8Array(12).fill(-1);for(let o=0;o<t.length;o++)for(let s=0;s<t[o].length;s++){let c=t[o][s].toUpperCase(),l=n.length,u=e(c);if(r[u]!==-1)throw Error(`duplicate letter in puzzle: ${c}`);n.push(c),r[u]=l,i[u]=1<<l,a[l]=o}return{sides:t,letters:n,letterIndex:r,letterBit:i,sideOf:a,allCoveredMask:(1<<n.length)-1}}let i=null;var a=class e{constructor(){this.contents=new Map}static async load(t){if(i)return i;let n=new e,r=await(await fetch(t)).text();for(let e of r.split(`
`)){let t=e.trim();t.length>0&&n.add(t)}return i=n,n}add(e){let t=``;for(let n=0;n<e.length;n++)t+=e.charAt(n),this.contents.has(t)||this.contents.set(t,!1);this.contents.set(t,!0)}hasString(e){return e?this.contents.has(e.toLowerCase()):!1}hasFullWord(e){if(!e)return!1;let t=e.toLowerCase();return this.contents.has(t)&&this.contents.get(t)}getValidWords(e){let n=[];for(let[r,i]of this.contents){if(!i||r.length<3)continue;let a=r.toUpperCase(),o=!0,s=0;for(let n=0;n<a.length;n++){let r=t(e,a[n]);if(r<0){o=!1;break}if(s|=1<<r,n>0){let i=t(e,a[n-1]);if(e.sideOf[r]===e.sideOf[i]){o=!1;break}}}if(!o)continue;let c=t(e,a[0]),l=t(e,a[a.length-1]);n.push({word:a,coverageMask:s,firstLetterIdx:c,lastLetterIdx:l})}return n}},o=`struct WordData {
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
`,s=class e{constructor(e){this.device=e;let t=e.limits.maxStorageBufferBindingSize;this.maxSolutions=Math.min(Math.floor(t*.05/36),65536),this.maxChains=Math.floor(t*.5/36)}static async create(){if(typeof navigator>`u`||!navigator.gpu)return null;try{let t=await navigator.gpu.requestAdapter();return t?new e(await t.requestDevice()):null}catch{return null}}async findBest(e,t,n){let r=e.length;if(r===0)return{success:!1,data:[]};let i=this.createPipeline(),a=this.createWordBuffer(e),o=this.initOneWordChains(e),s=[];for(let e=0;e<t-1;e++){let c=o.length/9;if(c===0)break;let l=await this.extend(i,a,o,c,r,n,t);if(s.push(...l.solutions),s.length>0?console.log(`[GPU] Pass ${e+1}: found ${l.solutions.length} solutions`):console.log(`[GPU] Pass ${e+1}: ${l.nextChains.length/9} incomplete chains`),s.length>0)break;o=l.nextChains}return a.destroy(),this.selectBest(s,e)}createPipeline(){let e=this.device.createShaderModule({code:o});return this.device.createComputePipeline({layout:`auto`,compute:{module:e,entryPoint:`extendChains`}})}createWordBuffer(e){let t=new Uint32Array(e.length*4);for(let n=0;n<e.length;n++){let r=e[n];t[n*4+0]=r.coverageMask,t[n*4+1]=r.firstLetterIdx,t[n*4+2]=r.lastLetterIdx,t[n*4+3]=r.word.length}return this.uploadStorage(t)}initOneWordChains(e){let t=e.length,n=new Uint32Array(t*9);for(let r=0;r<t;r++){let t=r*9;n[t+0]=r,n[t+5]=e[r].coverageMask,n[t+6]=r,n[t+7]=1,n[t+8]=e[r].word.length}return n}async extend(e,t,n,r,i,a,o){let s=this.uploadStorage(n.subarray(0,r*9)),c=this.uploadUniform(new Uint32Array([r,i,a,o])),l=this.emptyStorage(this.maxSolutions*36),u=this.counterBuffer(),d=this.emptyStorage(this.maxChains*36),f=this.counterBuffer(),p=this.device.createBindGroup({layout:e.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t}},{binding:1,resource:{buffer:s}},{binding:2,resource:{buffer:c}},{binding:3,resource:{buffer:l}},{binding:4,resource:{buffer:u}},{binding:5,resource:{buffer:d}},{binding:6,resource:{buffer:f}}]}),m=this.device.limits.maxComputeWorkgroupsPerDimension,h=Math.ceil(r*i/256),g=Math.min(h,m),_=Math.ceil(h/m),v=this.device.createCommandEncoder(),y=v.beginComputePass();y.setPipeline(e),y.setBindGroup(0,p),y.dispatchWorkgroups(g,_),y.end(),this.device.queue.submit([v.finish()]);let b=(await this.readBuffer(u,4))[0],x=(await this.readBuffer(f,4))[0],S=Math.min(b,this.maxSolutions),C=Math.min(x,this.maxChains);b>this.maxSolutions&&console.warn(`[GPU] dropped ${b-this.maxSolutions} solutions (cap ${this.maxSolutions})`),x>this.maxChains&&console.warn(`[GPU] dropped ${x-this.maxChains} chains (cap ${this.maxChains})`);let w=[];if(S>0){let e=await this.readBuffer(l,S*9*4);for(let t=0;t<S;t++){let n=t*9,r=e[n+7],i=[];for(let t=0;t<r;t++)i.push(e[n+t]);w.push({words:i,totalChars:e[n+8]})}}let T=C>0?await this.readBuffer(d,C*9*4):new Uint32Array;for(let e of[s,c,l,u,d,f])e.destroy();return{solutions:w,nextChains:T}}uploadStorage(e){let t=this.device.createBuffer({size:e.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(t,0,e),t}uploadUniform(e){let t=this.device.createBuffer({size:e.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(t,0,e),t}emptyStorage(e){return this.device.createBuffer({size:e,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC})}counterBuffer(){let e=this.device.createBuffer({size:4,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(e,0,new Uint32Array([0])),e}async readBuffer(e,t){let n=this.device.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),r=this.device.createCommandEncoder();r.copyBufferToBuffer(e,0,n,0,t),this.device.queue.submit([r.finish()]),await n.mapAsync(GPUMapMode.READ);let i=n.getMappedRange(),a=new Uint32Array(i.byteLength/4);return a.set(new Uint32Array(i)),n.unmap(),n.destroy(),a}selectBest(e,t){if(e.length===0)return{success:!1,data:[]};let n=e=>e.words.map(e=>t[e].word),r=e[0],i=n(r).join(``);for(let t=1;t<e.length;t++){let a=e[t],o=n(a).join(``);(a.totalChars<r.totalChars||a.totalChars===r.totalChars&&o<i)&&(r=a,i=o)}return{success:!0,data:n(r)}}},c=class{constructor(e,t){this.ctx=e,this.dictionary=t,this.words=Array.from({length:5},()=>``),this.wordCoverage=[,,,,,].fill(0),this.solvingProcess=[],this.bestSolution=null}allLettersUsed(){let e=0;for(let t of this.wordCoverage)e|=t;return e===this.ctx.allCoveredMask}onSameSide(e,t){return this.ctx.sideOf[e]===this.ctx.sideOf[t]}addLetter(e,t){this.words[t]+=e,this.wordCoverage[t]|=n(this.ctx,e)}removeLetter(e){let t=this.words[e];this.words[e]=t.substring(0,t.length-1);let r=0;for(let t of this.words[e])r|=n(this.ctx,t);this.wordCoverage[e]=r}lastLetter(e){let t=this.words[e];return t[t.length-1]}alreadyUsed(e){return this.words.some(t=>t===e)}isValid(e,n,r){if(n===0&&r===0)return!0;if(n>=1&&r===0)return e===this.lastLetter(n-1);let i=this.words[n],a=i+e,o=t(this.ctx,e),s=t(this.ctx,i[i.length-1]);return!this.onSameSide(o,s)&&!this.alreadyUsed(a)&&this.dictionary.hasString(a)}solveRB(e,t,n){if(this.allLettersUsed()&&this.dictionary.hasFullWord(this.words[e])&&this.words[e].length>=3)return!0;if(e>=n)return!1;for(let r of this.ctx.letters)if(this.isValid(r,e,t)){if(this.addLetter(r,e),this.solveRB(e,t+1,n))return!0;let i=this.words[e];if(i.length>=3&&this.dictionary.hasFullWord(i)&&(this.solvingProcess.push(this.words.filter(e=>e!==``)),this.solveRB(e+1,0,n)))return!0;this.removeLetter(e)}return!1}solve(){let e=1;for(;e<=5;){if(this.solveRB(0,0,e))return this.solvingProcess.push(this.words.filter(e=>e!==``)),{success:!0,data:this.solvingProcess};e++}let t=this.solvingProcess.reduce((e,t)=>e.length>t.length?e:t,[]);return this.solvingProcess.push(t),{success:!1,data:this.solvingProcess}}static findBestCPU(e,t,n){let r=null,i=1/0,a=e=>{let t=e.reduce((e,t)=>e+t.length,0);return t<i?!0:t===i&&r?e.join(``).localeCompare(r.join(``))<0:!1},o=new Map;for(let t of e){let e=o.get(t.firstLetterIdx)??[];e.push(t),o.set(t.firstLetterIdx,e)}if(t>=1)for(let t of e)t.coverageMask===n&&(!r||a([t.word]))&&(r=[t.word],i=t.word.length);if(t>=2)for(let t of e){let e=o.get(t.lastLetterIdx);if(e){for(let o of e)if(t.word!==o.word&&(t.coverageMask|o.coverageMask)===n){let e=[t.word,o.word];(!r||a(e))&&(r=e,i=t.word.length+o.word.length)}}}if(t>=3&&!r)for(let t of e){let e=o.get(t.lastLetterIdx);if(e)for(let s of e){if(t.word===s.word)continue;let e=t.coverageMask|s.coverageMask;if(e===n){let e=[t.word,s.word];(!r||a(e))&&(r=e,i=t.word.length+s.word.length);continue}let c=o.get(s.lastLetterIdx);if(c){for(let o of c)if(!(o.word===t.word||o.word===s.word)&&(e|o.coverageMask)===n){let e=[t.word,s.word,o.word];(!r||a(e))&&(r=e,i=t.word.length+s.word.length+o.word.length)}}}}return t>=4&&!r?{success:!1,data:[]}:{success:r!==null,data:r??[]}}findBestBacktracking(e){return this.bestSolution=null,this.words=Array.from({length:5},()=>``),this.wordCoverage=[,,,,,].fill(0),this.solveRBFull(0,0,e),{success:this.bestSolution!==null,data:this.bestSolution??[]}}solveRBFull(e,t,n){let r=0;if(this.allLettersUsed()&&this.dictionary.hasFullWord(this.words[e])&&this.words[e].length>=3){let e=this.words.filter(e=>e!==``);return(!this.bestSolution||this.isBetterSolution(e,this.bestSolution))&&(this.bestSolution=[...e]),1}if(e>=n)return 0;for(let i of this.ctx.letters)if(this.isValid(i,e,t)){this.addLetter(i,e),r+=this.solveRBFull(e,t+1,n);let a=this.words[e];a.length>=3&&this.dictionary.hasFullWord(a)&&(r+=this.solveRBFull(e+1,0,n)),this.removeLetter(e)}return r}isBetterSolution(e,t){let n=e.join(``),r=t.join(``);return n.length<r.length||n.length===r.length&&n.localeCompare(r)<0}};let l,u=null;async function d(){return l===void 0?(l=await s.create(),console.log(l?`[Solver] Using WebGPU for findBest`:`[Solver] WebGPU not available, using CPU fallback`),l):l}async function f(e){let t=performance.now(),n=await a.load(`/letter-boxed/word_list.txt`),i=performance.now()-t,o=e.join(`|`).toUpperCase();if(u?.key===o)return{dictionary:n,cache:u};let s=r(e),c=performance.now(),l=n.getValidWords(s),d=performance.now()-c;return console.log(`[Solver] ${l.length} valid words (dict: ${i.toFixed(1)}ms, filter: ${d.toFixed(1)}ms)`),u={key:o,ctx:s,validWords:l},{dictionary:n,cache:u}}async function p(e){let{dictionary:t,cache:{ctx:n,validWords:r}}=await f(e.sides);if(e.type===`solve`){let e=new c(n,t),r=performance.now(),i=e.solve(),a=performance.now()-r;return console.log(`[Solver] solve() completed in ${a.toFixed(1)}ms (CPU backtracking)`),{type:`solveResult`,...i}}let i=await d();if(i)try{let t=performance.now(),a=await i.findBest(r,e.numWords,n.allCoveredMask),o=performance.now()-t;if(console.log(`[Solver] findBest() GPU completed in ${o.toFixed(1)}ms`),a.success)return{type:`findBestResult`,...a};console.log(`[Solver] GPU found no solution, falling back to CPU`)}catch(e){console.warn(`[Solver] GPU findBest failed, falling back to CPU:`,e)}let a=performance.now(),o=c.findBestCPU(r,e.numWords,n.allCoveredMask),s=performance.now()-a;if(console.log(`[Solver] findBest() CPU word-level completed in ${s.toFixed(1)}ms`),o.success)return{type:`findBestResult`,...o};let l=performance.now(),u=new c(n,t).findBestBacktracking(e.numWords),p=performance.now()-l;return console.log(`[Solver] findBest() CPU backtracking completed in ${p.toFixed(1)}ms`),{type:`findBestResult`,...u}}self.onmessage=async e=>{try{let t=performance.now(),n=await p(e.data),r=performance.now()-t;console.log(`[Solver] Total worker time: ${r.toFixed(1)}ms`),self.postMessage(n)}catch(e){let t=e instanceof Error?e.message:String(e);self.postMessage({type:`error`,message:t})}}})();