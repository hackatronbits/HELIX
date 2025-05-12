const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { SpeechClient } = require('@google-cloud/speech');

const router = express.Router();

// Google Speech Client
const client = new SpeechClient({
  keyFilename: 'google-credentials.json',
});

// Multer setup
const upload = multer({ dest: 'uploads/' });

router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    const file = fs.readFileSync(req.file.path);
    const audioBytes = file.toString('base64');

    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: 'LINEAR16', // Adjust based on your audio type
        sampleRateHertz: 16000, // Match your audio
        languageCode: 'en-US',
      },
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    fs.unlinkSync(req.file.path); // Clean up

    res.json({ transcription });
  } catch (err) {
    console.error('Speech-to-text error:', err.message);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

module.exports = router;
