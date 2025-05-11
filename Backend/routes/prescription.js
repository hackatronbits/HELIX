const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const router = express.Router();

const upload = multer({ dest: "uploads/" });

//api key
const API_KEY =
  "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"; //key we will secure this .env file later

const MODEL = "google/gemini-2.0-flash-exp:free";

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");

    const payload = {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a medical assistant. Analyze the prescription image and extract:
1. Names of all the medicines
2. Dosage schedule (like 'once daily', 'twice a day', or '1-0-1') for each medicine.
also check is it a real medicine or not first,
Provide the result in a clean bullet list format. don't give * at the starting also write type of med tab in starting (if available) also add a note and the end after getting all the medicine describe short whoem the medicine will be prescripted by the doctor and for what reason`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    };

    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      payload,
      { headers }
    );

    const content = response.data.choices?.[0]?.message?.content;
    console.log("Raw model content:\n", content);

    fs.unlinkSync(imagePath); 

    if (!content) {
      return res.status(500).json({ error: "Invalid model response." });
    }
    return res.send(content);
  } catch (err) {
    console.error("Full Error:", err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
});

module.exports = router;
