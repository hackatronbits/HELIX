const express = require("express");
const router = express.Router();
const axios = require("axios");
const {dataset}=require("../dataset")

router.post("/predict", async (req, res) => {
  // console.log(req.body)
  const { symptom_text } = req.body;
  console.log(symptom_text);
  // const obj = { "disease": "chills" };
  const arr = symptom_text.split(",").map(symptom => symptom.trim());

console.log(arr);

  try {
    // // console.log("symptoms",symptoms);
    // const response = await axios.post("http://localhost:5000/predict", {
    //   symptom_text: symptoms, // ✅ match expected FastAPI key
    // });
    // return res.json(response.data);
    console.log("enter")
    if (arr.length === 0) {
      console.log("error in len")
      return res.status(400).json({ error: "Invalid symptoms array" });
    }
  
    // Normalize input
    const inputSymptoms = arr.map(s => s.toLowerCase().trim());
  
    // Match diseases
    const matchedDiseases = dataset.filter(disease => {
      const diseaseSymptoms = disease.Symptoms.map(s => s.toLowerCase());
      return inputSymptoms.some(symptom => diseaseSymptoms.includes(symptom));
    });

    console.log("filtered diesease",matchedDiseases)
    const results = matchedDiseases.map(d => ({
      disease: d.Disease,
      symptoms: d.Symptoms,
      medicines: d.Medicines,
      dosages: d.Dosages,
      prices: d["Prices (INR)"],
      brandNames: d["Brand Names"]
    }));
  
    res.json({ matches: results });
  } catch (error) {
    console.error("Prediction error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Error calling ML service" });
  }
});

module.exports = router;