"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";

export default function PrescriptionMedicineFinder() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [medicineName, setMedicineName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "results">("upload");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setStep("preview");
    }
  };

  const findMedicineName = async () => {
    if (!uploadedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", uploadedImage);

      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMedicineName(data.medicine_name || "No medicine name found.");
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setUploadedImage(null);
    setImagePreviewUrl(null);
    setMedicineName("");
    setError(null);
    setStep("upload");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#006994] to-[#004f63] text-white flex items-center justify-center p-4">
  <div className="w-full max-w-6xl bg-white/10 rounded-2xl shadow-2xl p-6 backdrop-blur-md border border-[#006994]/40">

    {/* Top Bar: Left (Header) and Right (Steps) */}
    <div className="flex justify-between items-start mb-8 flex-wrap gap-4">

      {/* Header Section */}
      <header className="flex items-center">
        <div className="bg-gradient-to-r from-black via-[#006994] to-[#004f63] p-2 rounded-lg mr-3 shadow-[0_0_20px_#006994] ring-1 ring-[#006994]/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-100 to-blue-500 bg-clip-text text-transparent font-poppins">
            Prescription Reader AI
          </h1>
          <p className="bg-gradient-to-r from-white to-cyan-500 bg-clip-text text-transparent font-poppins">
            Extract medicine names from prescription images
          </p>
        </div>
      </header>

      {/* Steps Indicator */}
      <div className="flex items-center justify-end mb-6">
        <div className="text-sm font-semibold text-white bg-[#004f63]/30 rounded-xl px-4 py-2 shadow-md border border-[#006994]/40">
          <span className={`transition-all ${step === "upload" ? "text-cyan-300" : "opacity-50"}`}>Upload</span>
          <span className="mx-2 opacity-50">{">"}</span>
          <span className={`transition-all ${step === "preview" ? "text-cyan-300" : "opacity-50"}`}>Preview</span>
          <span className="mx-2 opacity-50">{">"}</span>
          <span className={`transition-all ${step === "results" ? "text-cyan-300" : "opacity-50"}`}>Results</span>
        </div>
      </div>

    </div>

    {/* Card Content Based on Steps */}
    <AnimatePresence mode="wait">
      {step === "upload" && (
        <motion.div
          key="upload"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-8 text-black max-w-lg mx-auto border border-[#006994]/40"
        >
          <h2 className="text-2xl font-semibold mb-4 text-[#004f63] text-center">Upload Prescription Photo</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="prescription-photo"
          />
          <button
            onClick={() => document.getElementById("prescription-photo")?.click()}
            className="w-full px-3 py-1.5 rounded-xl font-medium border-2 border-cyan-600 bg-gradient-to-r from-[#004f63] to-blue-300 text-white hover:from-cyan-600 hover:to-cyan-700 transition-all"
          >
            Choose File
          </button>
        </motion.div>
      )}

      {step === "preview" && imagePreviewUrl && (
        <motion.div
          key="preview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-8 text-black max-w-lg mx-auto border border-[#006994]/40"
        >
          <h2 className="text-2xl font-semibold mb-4 text-[#004f63] text-center">Image Preview</h2>
          <div className="flex justify-center mb-4">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="w-64 h-64 object-cover rounded-lg border border-[#006994]/40"
            />
          </div>
          <div className="flex gap-4 border border-[#006994]/40 rounded-lg p-3">
            <button
              onClick={reset}
              className="flex-1 px-3 py-1.5 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={findMedicineName}
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-700 to-blue-500 text-white font-semibold disabled:opacity-50 hover:from-cyan-600 hover:to-blue-600 transition-all"
            >
              {isLoading ? "Analyzing..." : "Extract Medicine Name"}
            </button>
          </div>
        </motion.div>
      )}

      {step === "results" && (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-8 text-black max-w-lg mx-auto border border-[#006994]/40"
        >
          <h2 className="text-2xl font-semibold mb-4 text-[#004f63] text-center">Medicine Name</h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <div className="bg-gray-100 p-4 rounded-md border border-[#006994]/40">
            <pre className="text-black whitespace-pre-wrap">{medicineName}</pre>
          </div>
          <button
            onClick={reset}
            className="mt-6 w-full px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-700 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all"
          >
            Try Another Image
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
</main>

  );
}