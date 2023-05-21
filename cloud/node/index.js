import functions from "@google-cloud/functions-framework";
import LetterSquare from "./LetterSquare.js";

functions.http("solve", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");

  const { input, length } = req.query;
  if (!input || !Array.isArray(input)) {
    res.status(400).send("Invalid input");
  }

  const driver = new LetterSquare(input);
  if (length) {
    const result = driver.findBest(+length);
    res.send(result);
  } else {
    const result = driver.solve();
    result.success ? res.send(result.data) : res.sendStatus(500);
  }
});
