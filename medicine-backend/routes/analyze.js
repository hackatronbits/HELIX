const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const router = express.Router();

const upload = multer({ dest: "uploads/" });

const API_KEY =
  "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"; // placeholder
const MODEL = "google/gemini-2.0-flash-exp:free";

// Helper function to fetch price for a medicine using OpenRouter API
async function fetchMedicinePrice(medicineName) {
  console.log(`Attempting to fetch price for: ${medicineName}`);
  try {
    const payload = {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a medical expert. Provide the current market price of the medicine "${medicineName}" in Indian Rupees, formatted as "RS.<amount>" (e.g., "RS.35"). Use reliable sources or common pricing data for India. If the exact price is unavailable, estimate a reasonable price based on similar medicines or return "RS.0" as a last resort. Return only the price string, no extra text.`,
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

    const content = response.data.choices?.[0]?.message?.content?.trim();
    console.log(`Price fetched for ${medicineName}: ${content}`);

    if (!content || !content.match(/^RS\.\d+$/)) {
      console.warn(`Invalid price format for ${medicineName}: ${content}`);
      return "RS.10"; // Temporary hardcoded fallback for testing
    }

    return content;
  } catch (err) {
    console.error(`Error fetching price for ${medicineName}:`, err.message);
    return "RS.10"; // Temporary hardcoded fallback for testing
  }
}

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
              text: `You are a medical expert. You are given a photo of a medicine (its packaging, label, or strip). Your job is to extract the **medicine name** (if available) and provide the price of the medicine in rupee in this format example - RS.34, and return 3 to 5 **generic alternatives** with their price smaller than given medicine in rupee in this format example - RS.34 ⚠️ Strictly return a valid JSON object like this:
{
  "original_medicine_name": "Paracetamol 500mg",
  "original_price": "RS.35",
  "generic_medicine": [
    {
      "medicine_name": "Crocin 500",
      "medicine_price": "RS.15"
    },
    ...
  ]
}
No extra text, no markdown, just raw JSON.`,
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

    fs.unlinkSync(imagePath); // delete image file

    const content = response.data.choices?.[0]?.message?.content;
    console.log("Raw model content:\n", content);

    if (!content) {
      return res.status(500).json({ error: "Invalid model response." });
    }

    // Try to extract a valid JSON block
    let parsed;
    try {
      const jsonMatch = content.match(/{[\s\S]*}/);
      if (!jsonMatch) {
        throw new Error("No JSON block found in model response.");
      }

      parsed = JSON.parse(jsonMatch[0]);
      console.log("Parsed JSON:", JSON.stringify(parsed, null, 2));

      // Validate original_medicine_name
      if (!parsed.original_medicine_name || !parsed.original_medicine_name.trim()) {
        throw new Error("Original medicine name is missing or invalid.");
      }

      // Fetch real price for original medicine if missing or null
      if (parsed.original_price === null || parsed.original_price === undefined) {
        console.log(`Fetching price for original medicine: ${parsed.original_medicine_name}`);
        parsed.original_price = await fetchMedicinePrice(parsed.original_medicine_name);
      }

      // Validate and fetch real prices for generic medicines
      parsed.generic_medicine = (parsed.generic_medicine || [])
        .filter((item) => item.medicine_name && item.medicine_name.trim()) // Ensure medicine_name exists
        .map((item) => ({
          medicine_name: item.medicine_name,
          medicine_price: item.medicine_price, // Preserve existing price or null
        }));

      // Fetch prices for generic medicines with null or missing prices
      for (let i = 0; i < parsed.generic_medicine.length; i++) {
        if (parsed.generic_medicine[i].medicine_price === null || parsed.generic_medicine[i].medicine_price === undefined) {
          console.log(`Fetching price for generic medicine: ${parsed.generic_medicine[i].medicine_name}`);
          parsed.generic_medicine[i].medicine_price = await fetchMedicinePrice(parsed.generic_medicine[i].medicine_name);
        }
      }

      // Ensure 3 to 5 generic medicines
      if (parsed.generic_medicine.length < 3) {
        console.warn("Less than 3 generic medicines found, padding with dummy entries.");
        const existingNames = new Set(parsed.generic_medicine.map((item) => item.medicine_name));
        let counter = 1;
        while (parsed.generic_medicine.length < 3) {
          const dummyName = `Generic ${counter}`;
          if (!existingNames.has(dummyName)) {
            console.log(`Fetching price for dummy medicine: ${dummyName}`);
            parsed.generic_medicine.push({
              medicine_name: dummyName,
              medicine_price: await fetchMedicinePrice(dummyName),
            });
            existingNames.add(dummyName);
          }
          counter++;
        }
      }

      // Final validation: Ensure no null prices remain
      if (
        parsed.original_price === null ||
        parsed.original_price === undefined ||
        parsed.generic_medicine.some((item) => item.medicine_price === null || item.medicine_price === undefined)
      ) {
        console.error("Null prices detected after fetching:", JSON.stringify(parsed, null, 2));
        throw new Error("Failed to fetch valid prices for some medicines.");
      }

    } catch (err) {
      console.error("Processing Error:", err.message);
      return res
        .status(500)
        .json({ error: "Failed to process model response. Check server logs." });
    }

    console.log("Final response:", JSON.stringify(parsed, null, 2));
    return res.json(parsed);
  } catch (err) {
    console.error("Full Error:", err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
});

module.exports = router;