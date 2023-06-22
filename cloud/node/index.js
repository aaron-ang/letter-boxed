import { gzipSync } from "zlib";
import functions from "@google-cloud/functions-framework";

import LetterSquare from "./LetterSquare.js";

functions.http("solveHttp", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  const { input, length } = req.query;
  if (!input || !Array.isArray(input)) {
    return res.status(400).send("Invalid input.");
  }

  const driver = new LetterSquare(input);
  let compressed;
  if (length) {
    if (isNaN(+length)) {
      return res.status(400).send("Invalid length.");
    }
    compressed = gzipSync(JSON.stringify(driver.findBest(+length)));
  } else {
    compressed = gzipSync(JSON.stringify(driver.solve()));
  }
  if (!compressed) {
    return res.sendStatus(500);
  }

  res.set("Content-Encoding", "gzip");
  res.send(compressed);
});
