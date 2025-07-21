Inspired by The NYTimes' [Letter Boxed](https://www.nytimes.com/puzzles/letter-boxed) Game

Check out the visualizer at https://aaron-ang.github.io/letter-boxed

**Current features/optimizations**

- Dropdown to customize visualization delay duration
- Reduce tail latency for randomly-generated puzzles by choosing from the [top 17 most frequent letters](https://mathcenter.oxford.emory.edu/site/math125/englishLetterFreqs/)
- Cache previous puzzle's input and result to prevent recomputation when toggling the visualization option

**Upcoming features**

- [x] `Find Best` button replaces `Solve` button after first run
  - Returns solution with the smallest number of words and total characters
- [x] Decouple application
  - Deployed API server written in [Node.js](cloud/node) on [Google Cloud](https://cloud.google.com/functions)
  - Unit testing with [Mocha](https://mochajs.org/), [Sinon](https://sinonjs.org/), and [C8](https://github.com/bcoe/c8)
  - **Tradeoff:** significant reduction in client RAM and CPU load in exchange for slightly increased response time
- [x] Compress response payload using [Gzip](https://www.gnu.org/software/gzip/) to minimize network bandwidth
- [x] Rewrite Cloud Function in [Go](cloud/go) with extensive unit testing
- [x] Add slider that steps through the solving process

## Demo video

<img src='walkthrough.gif' title='Video Walkthrough' width='' alt='Video Walkthrough' />
