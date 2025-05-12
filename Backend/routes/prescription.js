const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const router = express.Router();

const upload = multer({ dest: "uploads/" });

// API Key (Note: Secure it using .env later)
const API_KEY =
  "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"; 

const MODEL = "google/gemini-2.0-flash-exp:free";

router.post("/PrescriptoSathi", upload.single("image"), async (req, res) => {
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
              text: `I have an image of a medical prescription. Please perform the following tasks:

Extract the text from the image using OCR.
Identify the medications, their dosages, schedules, and durations.
Interpret the schedule notations (e.g., 1-0-0-1, 1-0-0-0) as follows:
1-0-0-1 means BD (Twice daily)
1-0-0-0 means OD (Once daily)
Include the duration (e.g., x 5 days) as specified.
Format the output as a bullet-point list in the following structure:
Medication Name Dosage: Schedule (Expanded Meaning) x Duration
Ignore irrelevant text (e.g., doctor's name, date, or other notes) and focus only on the medication details.
For example, if the prescription includes "Tab Augmentin 625mg 1-0-0-1 x 5 days" and "Tab Pan-D 40mg 1-0-0-0 x 5 days", the output should look like this:

Tab Augmentin 625mg: BD (Twice daily) x 5 days
Tab Pan-D 40mg: OD (Once daily) x 5 days
Please process the image and provide the extracted medication details in this format.`,
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
    console.log("Processed model response:", content);  // Log the response for debugging

    fs.unlinkSync(imagePath); // Clean up the uploaded image

    if (!content) {
      return res.status(500).json({ error: "Invalid model response." });
    }

    // Send the correct data structure to the frontend
    return res.json({ content: content });  // Return 'content' to match the frontend code
  } catch (err) {
    console.error("Full Error:", err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
});

module.exports = router;
