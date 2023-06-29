Inspired by The NYTimes' [Letter Boxed](https://www.nytimes.com/puzzles/letter-boxed) Game

Check out the visualizer at https://aaron-ang.github.io/letter-boxed

**Current features/optimizations**

- Dropdown to customize visualization delay duration
- Reduce tail latency for randomly-generated puzzles by choosing from the [top 17 most frequent letters](https://www3.nd.edu/~busiforc/handouts/cryptography/letterfrequencies.html)
- Cache previous puzzle's input and result to prevent recomputation when toggling the visualization option

**Planned features**

- [x] `Find Best` button replaces `Solve` button after first run
  - Returns solution with the smallest number of words and total characters
- [x] Decouple application
  - Server: [Node.js](https://nodejs.org) running on [Google Cloud](https://cloud.google.com/functions)
  - Tradeoff: significant reduction in client RAM and CPU load in exchange for slightly increased response time
  - [Gzip](https://www.gnu.org/software/gzip/) the server response to minimize network bandwidth
  - Testing with [Mocha](https://mochajs.org/), [Sinon](https://sinonjs.org/), and [C8](https://github.com/bcoe/c8)
- [x] Rewrite Cloud Function in [Go](https://go.dev)
  - Implement unit tests
- [x] Slider that steps through the solving process

## Demo video (Old)

<img src='walkthrough.gif' title='Video Walkthrough' width='' alt='Video Walkthrough' />
