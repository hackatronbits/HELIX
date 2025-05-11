const express = require("express");
const cors = require("cors");
const prescription = require("./routes/prescription"); // Ensure path is correct


const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


app.use("/prescription", prescription);

//checking the server is working or not
app.get("/", (req, res) => {
  res.send("Server is working!");
});


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

