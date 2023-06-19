import functions from "@google-cloud/functions-framework";
import LetterSquare from "./LetterSquare.js";

functions.http("solveHttp", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");

  const { input, length } = req.query;
  if (!input || !Array.isArray(input)) {
    return res.status(400).send("Invalid input");
  }

  const driver = new LetterSquare(input);
  if (length) {
    if (isNaN(+length)) {
      return res.status(400).send("Invalid length");
    }
    res.send(driver.findBest(+length));
  } else {
    res.send(driver.solve());
  }
});
