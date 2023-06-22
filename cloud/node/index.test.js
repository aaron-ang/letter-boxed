import sinon from "sinon";
import assert from "assert";
import { describe, it, before } from "mocha";
import { unzipSync } from "zlib";
import { getFunction } from "@google-cloud/functions-framework/testing";

describe("functions_solve_http", () => {
  const getMocks = () => {
    const req = { body: {}, query: {} };

    return {
      req: req,
      res: {
        set: () => {},
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
        sendStatus: sinon.stub().returnsThis(),
      },
    };
  };

  before(async () => {
    await import("./index.js");
  });

  it("solve: should return status 400 if no query input", () => {
    const mocks = getMocks();

    const solve = getFunction("solveHttp");
    solve(mocks.req, mocks.res);
    assert.equal(mocks.res.status.calledOnceWith(400), true);
  });

  it("solve: should return status 400 if query input is not an array", () => {
    const mocks = getMocks();
    mocks.req.query.input = "";

    const solve = getFunction("solveHttp");
    solve(mocks.req, mocks.res);
    assert.equal(mocks.res.status.calledOnceWith(400), true);
  });

  it("solve: should return longest solving step if no solution is found", () => {
    const mocks = getMocks();
    mocks.req.query.input = ["ABC", "DEF", "GHI", "JKL"];

    const solve = getFunction("solveHttp");
    solve(mocks.req, mocks.res);
    const res = parseBuffer(mocks.res.send.getCall(0).args[0]);
    sinon.assert.match(res.slice(-1), [
      ["LILA", "ALIKE", "ELI", "ILIAD", "DIE"],
    ]);
  }).timeout(15000);

  it("solve: should return a nested array of the first solution found with viable query input", () => {
    const mocks = getMocks();
    mocks.req.query.input = ["SRG", "MDH", "IOL", "ENP"];

    const solve = getFunction("solveHttp");
    solve(mocks.req, mocks.res);
    const res = parseBuffer(mocks.res.send.getCall(0).args[0]);
    sinon.assert.match(res.slice(-1), [["MORPHS", "SHIELDING"]]);
  });

  it("solve: should return array of best solution with viable query input and length", () => {
    const mocks = getMocks();
    mocks.req.query.input = ["SRG", "MDH", "IOL", "ENP"];
    mocks.req.query.length = 2;

    const solve = getFunction("solveHttp");
    solve(mocks.req, mocks.res);
    const res = parseBuffer(mocks.res.send.getCall(0).args[0]);
    sinon.assert.match(res, ["MORPHS", "SINGLED"]);
  }).timeout(1000);

  it("solve: should return empty array if no best solution found", () => {
    const mocks = getMocks();
    mocks.req.query.input = ["SRG", "MDH", "IOL", "ENP"];
    mocks.req.query.length = 1;

    const solve = getFunction("solveHttp");
    solve(mocks.req, mocks.res);
    const res = parseBuffer(mocks.res.send.getCall(0).args[0]);
    sinon.assert.match(res, []);
  });
});

/**
 * Unzip and parse data from buffer
 * @param {Buffer} buffer
 * @returns {Array}
 */
const parseBuffer = (buffer) => {
  return JSON.parse(unzipSync(buffer).toString())["data"];
};
