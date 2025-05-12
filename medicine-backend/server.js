const express = require("express");
const cors = require("cors");
const analyzeRoute = require("./routes/analyze"); // Ensure path is correct

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Use /analyze for the route
app.use("/analyze", analyzeRoute);

app.get("/", (req, res) => {
  res.send("Server is working!");
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
