const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const multer = require('multer');
const OpenAI = require('openai');

// Initialize OpenAI with Whisper capabilities
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for handling audio file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (Whisper's max file size)
  },
  fileFilter: (req, file, cb) => {
    // Accept common audio formats
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload an audio file.'), false);
    }
  }
});

// Convert speech to text using Whisper AI
router.post('/convert', protect, upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Please upload an audio file'
      });
    }

    // Create a temporary file from the buffer
    const transcription = await openai.audio.transcriptions.create({
      file: req.file.buffer,
      model: "whisper-1",
      language: req.body.language || 'en', // Default to English if not specified
      response_format: "json",
      temperature: 0.2 // Lower temperature for more focused results
    });

    // Return the transcribed text
    res.status(200).json({
      success: true,
      data: {
        text: transcription.text,
        language: transcription.language || 'en'
      }
    });

  } catch (err) {
    // Handle specific OpenAI API errors
    if (err.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    // Handle file size errors from multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 25MB.'
      });
    }

    next(err);
  }
});

// Get supported languages
router.get('/languages', protect, (req, res) => {
  // List of languages supported by Whisper AI
  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'nl', name: 'Dutch' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' }
  ];

  res.status(200).json({
    success: true,
    data: supportedLanguages
  });
});

module.exports = router;
