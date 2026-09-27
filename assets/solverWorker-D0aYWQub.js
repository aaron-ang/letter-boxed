(function(){function e(e){return e.charCodeAt(0)-65}function t(t,n){return t.letterIndex[e(n)]}function n(t,n){return t.letterBit[e(n)]}let r=RegExp(`^[A-Za-z]{3}$`);function i(t){if(!Array.isArray(t)||t.length!==4||!t.every(e=>typeof e==`string`&&r.test(e)))throw Error(`puzzle must be 4 sides of 3 letters (A-Z), got ${JSON.stringify(t)}`);let n=[],i=new Int8Array(26).fill(-1),a=new Uint16Array(26),o=new Int8Array(12).fill(-1);for(let r=0;r<t.length;r++)for(let s=0;s<t[r].length;s++){let c=t[r][s].toUpperCase(),l=n.length,u=e(c);if(i[u]!==-1)throw Error(`duplicate letter in puzzle: ${c}`);n.push(c),i[u]=l,a[u]=1<<l,o[l]=r}return{sides:t,letters:n,letterIndex:i,letterBit:a,sideOf:o,allCoveredMask:(1<<n.length)-1}}let a=null;var o=class e{constructor(){this.contents=new Map}static async load(t){if(a)return a;let n=new e,r=await(await fetch(t)).text();for(let e of r.split(`
`)){let t=e.trim();t.length>0&&n.add(t)}return a=n,n}add(e){let t=``;for(let n=0;n<e.length;n++)t+=e.charAt(n),this.contents.has(t)||this.contents.set(t,!1);this.contents.set(t,!0)}hasString(e){return e?this.contents.has(e.toLowerCase()):!1}hasFullWord(e){if(!e)return!1;let t=e.toLowerCase();return this.contents.has(t)&&this.contents.get(t)}getValidWords(e){let n=[];for(let[r,i]of this.contents){if(!i||r.length<3)continue;let a=r.toUpperCase(),o=!0,s=0;for(let n=0;n<a.length;n++){let r=t(e,a[n]);if(r<0){o=!1;break}if(s|=1<<r,n>0){let i=t(e,a[n-1]);if(e.sideOf[r]===e.sideOf[i]){o=!1;break}}}if(!o)continue;let c=t(e,a[0]),l=t(e,a[a.length-1]);n.push({word:a,coverageMask:s,firstLetterIdx:c,lastLetterIdx:l})}return n}},s=`struct WordData {
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
@group(0) @binding(4) var<storage, read_write> nextChains: array<Chain>;
// [solution count, next chain count], read back together in one copy
@group(0) @binding(5) var<storage, read_write> counts: array<atomic<u32>, 2>;

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
    let slot = atomicAdd(&counts[0], 1u);
    if (slot < arrayLength(&solutions)) { solutions[slot] = nc; }
  } else if (nc.wordCount < uniforms.maxWords) {
    let slot = atomicAdd(&counts[1], 1u);
    if (slot < arrayLength(&nextChains)) { nextChains[slot] = nc; }
  }
}
`;function c(e,t){let n=[];for(let r=0;r<e.length;r++)e[r].coverageMask===t&&n.push({words:[r],totalChars:e[r].word.length});return n}var l=class e{constructor(e){this.device=e;let t=e.limits.maxStorageBufferBindingSize;this.maxSolutions=Math.min(Math.floor(t*.05/36),65536),this.maxChains=Math.floor(t*.5/36)}static async create(){if(typeof navigator>`u`||!navigator.gpu)return null;try{let t=await navigator.gpu.requestAdapter();return t?new e(await t.requestDevice()):null}catch{return null}}async findBest(e,t,n){let r=e.length;if(r===0||t<1)return{success:!1,data:[]};let i=c(e,n);if(i.length>0)return console.log(`[GPU] Pass 0: found ${i.length} 1-word solutions (CPU check)`),this.selectBest(i,e);let a=this.createPipeline(),o=this.createWordBuffer(e),s=this.emptyStorage(this.maxSolutions*36),l=this.counterBuffer(),u=this.uploadStorage(this.initOneWordChains(e)),d=u,f=this.emptyStorage(this.maxChains*36),p=r,m=[];for(let e=0;e<t-1&&p>0;e++){let i=await this.extend(a,{wordBuffer:o,chainBuf:d,chainCount:p,nextBuf:f,solBuf:s,countsBuf:l,wordCount:r,targetMask:n,maxWords:t});if(m.push(...i.solutions),m.length>0){console.log(`[GPU] Pass ${e+1}: found ${i.solutions.length} solutions`);break}console.log(`[GPU] Pass ${e+1}: ${i.nextCount} incomplete chains`),p=i.nextCount;let c=d===u?this.emptyStorage(this.maxChains*36):d;d=f,f=c}for(let e of[o,s,l,u,d,f])e.destroy();return this.selectBest(m,e)}createPipeline(){let e=this.device.createShaderModule({code:s});return this.device.createComputePipeline({layout:`auto`,compute:{module:e,entryPoint:`extendChains`}})}createWordBuffer(e){let t=new Uint32Array(e.length*4);for(let n=0;n<e.length;n++){let r=e[n];t[n*4+0]=r.coverageMask,t[n*4+1]=r.firstLetterIdx,t[n*4+2]=r.lastLetterIdx,t[n*4+3]=r.word.length}return this.uploadStorage(t)}initOneWordChains(e){let t=e.length,n=new Uint32Array(t*9);for(let r=0;r<t;r++){let t=r*9;n[t+0]=r,n[t+5]=e[r].coverageMask,n[t+6]=r,n[t+7]=1,n[t+8]=e[r].word.length}return n}async extend(e,t){let n=this.uploadUniform(new Uint32Array([t.chainCount,t.wordCount,t.targetMask,t.maxWords]));this.device.queue.writeBuffer(t.countsBuf,0,new Uint32Array([0,0]));let r=this.device.createBindGroup({layout:e.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:t.wordBuffer}},{binding:1,resource:{buffer:t.chainBuf}},{binding:2,resource:{buffer:n}},{binding:3,resource:{buffer:t.solBuf}},{binding:4,resource:{buffer:t.nextBuf}},{binding:5,resource:{buffer:t.countsBuf}}]}),i=this.device.limits.maxComputeWorkgroupsPerDimension,a=Math.ceil(t.chainCount*t.wordCount/256),o=Math.min(a,i),s=Math.ceil(a/i),c=this.device.createCommandEncoder(),l=c.beginComputePass();l.setPipeline(e),l.setBindGroup(0,r),l.dispatchWorkgroups(o,s),l.end(),this.device.queue.submit([c.finish()]);let u=await this.readBack([[t.countsBuf,8],[t.solBuf,this.maxSolutions*36]]);n.destroy();let[d,f]=u,p=Math.min(d,this.maxSolutions),m=Math.min(f,this.maxChains);d>this.maxSolutions&&console.warn(`[GPU] dropped ${d-this.maxSolutions} solutions (cap ${this.maxSolutions})`),f>this.maxChains&&console.warn(`[GPU] dropped ${f-this.maxChains} chains (cap ${this.maxChains})`);let h=[];for(let e=0;e<p;e++){let t=2+e*9,n=u[t+7],r=[];for(let e=0;e<n;e++)r.push(u[t+e]);h.push({words:r,totalChars:u[t+8]})}return{solutions:h,nextCount:m}}uploadStorage(e){let t=this.device.createBuffer({size:e.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(t,0,e),t}uploadUniform(e){let t=this.device.createBuffer({size:e.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});return this.device.queue.writeBuffer(t,0,e),t}emptyStorage(e){return this.device.createBuffer({size:e,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC})}counterBuffer(){return this.device.createBuffer({size:8,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST})}async readBack(e){let t=e.reduce((e,[,t])=>e+t,0),n=this.device.createBuffer({size:t,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),r=this.device.createCommandEncoder(),i=0;for(let[t,a]of e)r.copyBufferToBuffer(t,0,n,i,a),i+=a;this.device.queue.submit([r.finish()]),await n.mapAsync(GPUMapMode.READ);let a=new Uint32Array(t/4);return a.set(new Uint32Array(n.getMappedRange())),n.unmap(),n.destroy(),a}selectBest(e,t){if(e.length===0)return{success:!1,data:[]};let n=e=>e.words.map(e=>t[e].word),r=e[0],i=n(r).join(``);for(let t=1;t<e.length;t++){let a=e[t],o=n(a).join(``);(a.totalChars<r.totalChars||a.totalChars===r.totalChars&&o<i)&&(r=a,i=o)}return{success:!0,data:n(r)}}};function u(e,t){if(e.length!==t.length)return e.length<t.length;let n=e.join(``),r=t.join(``);return n.length===r.length?n.localeCompare(r)<0:n.length<r.length}var d=class{constructor(e,t){this.ctx=e,this.dictionary=t,this.words=Array.from({length:5},()=>``),this.wordCoverage=[,,,,,].fill(0),this.solvingProcess=[],this.bestSolution=null}allLettersUsed(){let e=0;for(let t of this.wordCoverage)e|=t;return e===this.ctx.allCoveredMask}onSameSide(e,t){return this.ctx.sideOf[e]===this.ctx.sideOf[t]}addLetter(e,t){this.words[t]+=e,this.wordCoverage[t]|=n(this.ctx,e)}removeLetter(e){let t=this.words[e];this.words[e]=t.substring(0,t.length-1);let r=0;for(let t of this.words[e])r|=n(this.ctx,t);this.wordCoverage[e]=r}lastLetter(e){let t=this.words[e];return t[t.length-1]}alreadyUsed(e){return this.words.some(t=>t===e)}isValid(e,n,r){if(n===0&&r===0)return!0;if(n>=1&&r===0)return e===this.lastLetter(n-1);let i=this.words[n],a=i+e,o=t(this.ctx,e),s=t(this.ctx,i[i.length-1]);return!this.onSameSide(o,s)&&!this.alreadyUsed(a)&&this.dictionary.hasString(a)}solveRB(e,t,n){if(this.allLettersUsed()&&this.dictionary.hasFullWord(this.words[e])&&this.words[e].length>=3)return!0;if(e>=n)return!1;for(let r of this.ctx.letters)if(this.isValid(r,e,t)){if(this.addLetter(r,e),this.solveRB(e,t+1,n))return!0;let i=this.words[e];if(i.length>=3&&this.dictionary.hasFullWord(i)&&(this.solvingProcess.push(this.words.filter(e=>e!==``)),this.solveRB(e+1,0,n)))return!0;this.removeLetter(e)}return!1}solve(){let e=1;for(;e<=5;){if(this.solveRB(0,0,e))return this.solvingProcess.push(this.words.filter(e=>e!==``)),{success:!0,data:this.solvingProcess};e++}let t=this.solvingProcess.reduce((e,t)=>e.length>t.length?e:t,[]);return this.solvingProcess.push(t),{success:!1,data:this.solvingProcess}}static findBestCPU(e,t,n){let r=null,i=e=>!r||u(e,r),a=Array.from({length:12},()=>[]);for(let t of e)a[t.firstLetterIdx].push(t);if(t>=1)for(let t of e)t.coverageMask===n&&i([t.word])&&(r=[t.word]);if(t>=2&&!r)for(let t of e){let e=a[t.lastLetterIdx];for(let a of e)if(t.word!==a.word&&(t.coverageMask|a.coverageMask)===n){let e=[t.word,a.word];i(e)&&(r=e)}}if(t>=3&&!r)for(let t of e){let e=a[t.lastLetterIdx];for(let o of e){if(t.word===o.word)continue;let e=t.coverageMask|o.coverageMask;if(e===n){let e=[t.word,o.word];i(e)&&(r=e);continue}let s=a[o.lastLetterIdx];for(let a of s)if(!(a.word===t.word||a.word===o.word)&&(e|a.coverageMask)===n){let e=[t.word,o.word,a.word];i(e)&&(r=e)}}}return t>=4&&!r?{success:!1,data:[]}:{success:r!==null,data:r??[]}}findBestBacktracking(e){return this.bestSolution=null,this.words=Array.from({length:5},()=>``),this.wordCoverage=[,,,,,].fill(0),this.solveRBFull(0,0,e),{success:this.bestSolution!==null,data:this.bestSolution??[]}}solveRBFull(e,t,n){let r=0;if(this.allLettersUsed()&&this.dictionary.hasFullWord(this.words[e])&&this.words[e].length>=3){let e=this.words.filter(e=>e!==``);return(!this.bestSolution||u(e,this.bestSolution))&&(this.bestSolution=[...e]),1}if(e>=n)return 0;for(let i of this.ctx.letters)if(this.isValid(i,e,t)){this.addLetter(i,e),r+=this.solveRBFull(e,t+1,n);let a=this.words[e];a.length>=3&&this.dictionary.hasFullWord(a)&&(r+=this.solveRBFull(e+1,0,n)),this.removeLetter(e)}return r}};let f,p=null;async function m(){return f===void 0?(f=await l.create(),console.log(f?`[Solver] Using WebGPU for findBest`:`[Solver] WebGPU not available, using CPU fallback`),f):f}async function h(e){let t=performance.now(),n=await o.load(`/letter-boxed/word_list.txt`),r=performance.now()-t,a=e.join(`|`).toUpperCase();if(p?.key===a)return{dictionary:n,cache:p};let s=i(e),c=performance.now(),l=n.getValidWords(s),u=performance.now()-c;return console.log(`[Solver] ${l.length} valid words (dict: ${r.toFixed(1)}ms, filter: ${u.toFixed(1)}ms)`),p={key:a,ctx:s,validWords:l},{dictionary:n,cache:p}}async function g(e){let{dictionary:t,cache:{ctx:n,validWords:r}}=await h(e.sides);if(e.type===`solve`){let e=new d(n,t),r=performance.now(),i=e.solve(),a=performance.now()-r;return console.log(`[Solver] solve() completed in ${a.toFixed(1)}ms (CPU backtracking)`),{type:`solveResult`,...i}}let i=await m();if(i)try{let t=performance.now(),a=await i.findBest(r,e.numWords,n.allCoveredMask),o=performance.now()-t;if(console.log(`[Solver] findBest() GPU completed in ${o.toFixed(1)}ms`),a.success)return{type:`findBestResult`,...a};console.log(`[Solver] GPU found no solution, falling back to CPU`)}catch(e){console.warn(`[Solver] GPU findBest failed, falling back to CPU:`,e)}let a=performance.now(),o=d.findBestCPU(r,e.numWords,n.allCoveredMask),s=performance.now()-a;if(console.log(`[Solver] findBest() CPU word-level completed in ${s.toFixed(1)}ms`),o.success)return{type:`findBestResult`,...o};let c=performance.now(),l=new d(n,t).findBestBacktracking(e.numWords),u=performance.now()-c;return console.log(`[Solver] findBest() CPU backtracking completed in ${u.toFixed(1)}ms`),{type:`findBestResult`,...l}}self.onmessage=async e=>{try{let t=performance.now(),n=await g(e.data),r=performance.now()-t;console.log(`[Solver] Total worker time: ${r.toFixed(1)}ms`),self.postMessage(n)}catch(e){let t=e instanceof Error?e.message:String(e);self.postMessage({type:`error`,message:t})}}})();