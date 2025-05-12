const express = require("express");
const cors = require("cors");
const prescriptionRoutes = require('./routes/prescription');
const speechToTextRoute = require("./routes/speechToText");


const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


app.use("/", prescriptionRoutes);
// app.use('/api', speechToTextRoute);


//checking the server is working or not
app.get("/", (req, res) => {
  res.send("Server is working!");
});


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

