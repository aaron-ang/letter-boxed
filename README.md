Inspired by The NYTimes' [Letter Boxed](https://www.nytimes.com/puzzles/letter-boxed) Game

Check out the visualizer at https://aaron-ang.github.io/letter-boxed

**Current features**

- Decoupled application
  - Client: React with TypeScript and Material UI
  - Server: Google Cloud Function (Go)
  - Tradeoff: reduced client RAM and CPU load in exchange for increased response time
- `Find best solution` button replaces `Solve` button after first run -> returns solution with the shortest number of words and total characters
- Dropdown to customize visualization delay duration
- Reduced max solve time for randomly-generated puzzles by choosing from the [top 17 most frequent letters](https://www3.nd.edu/~busiforc/handouts/cryptography/letterfrequencies.html)
- Cached previous puzzle and results to remove need for recomputation when switching between visualization toggle option
- Testing with [Mocha](https://mochajs.org/), [Sinon](https://sinonjs.org/), and [C8](https://github.com/bcoe/c8)

**Planned features**

- Slider that steps through the solving process

## Demo video

<img src='walkthrough.gif' title='Video Walkthrough' width='' alt='Video Walkthrough' />
