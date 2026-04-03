/**
 * Speech-to-Text API routes
 * Uses unified STT service (configurable via STT_PROVIDER constant)
 */

import { Router } from 'express';
import multer from 'multer';
import type { ApiResponse, STTRequest, STTResponse } from '../../../shared/types';
import { speechToTextExpress, isSTTAvailableExpress, getSTTProvider } from '../services/stt-express';

const router = Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

/**
 * POST /api/stt - Convert speech to text
 */
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!isSTTAvailableExpress()) {
      const provider = getSTTProvider();
      const providerName = provider === 'groq' ? 'Groq' : 'Deepgram';
      const response: ApiResponse<never> = {
        success: false,
        error: 'STT service unavailable',
        message: `${providerName} credentials not configured`,
      };

      return res.status(503).json(response);
    }

    if (!req.file) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request',
        message: 'Audio file is required',
      };

      return res.status(400).json(response);
    }

    const { language } = req.body;

    if (!language) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request',
        message: 'Language is required',
      };

      return res.status(400).json(response);
    }

    // Convert buffer to Blob-like object
    const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype });

    const sttRequest: STTRequest = {
      audioData: audioBlob,
      language,
    };

    const transcription = await speechToTextExpress(sttRequest);

    const response: ApiResponse<STTResponse> = {
      success: true,
      data: transcription,
    };

    res.json(response);
  } catch (error) {
    console.error('STT error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Speech-to-text failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/stt/status - Check STT service status
 */
router.get('/status', (req, res) => {
  try {
    const available = isSTTAvailableExpress();
    const provider = getSTTProvider();

    const response: ApiResponse<{ available: boolean; provider: string }> = {
      success: true,
      data: { available, provider },
      message: available
        ? `STT service is available (using ${provider})`
        : `STT service is not configured (${provider} credentials missing)`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error checking STT status:', error);

    const provider = getSTTProvider();
    const response: ApiResponse<{ available: boolean; provider: string }> = {
      success: false,
      error: 'Failed to check STT status',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: { available: false, provider },
    };

    res.status(500).json(response);
  }
});

export { router as sttRoutes };
