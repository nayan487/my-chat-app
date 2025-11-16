const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.post("/save", (req, res) => {
  const data = req.body;

  fs.writeFileSync(
    path.join(__dirname, "../chatHistory.json"),
    JSON.stringify(data, null, 2)
  );

  res.json({ status: "ok" });
});

// IMPORTANT: Export the app for Vercel
module.exports = app;
