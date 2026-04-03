/**
 * Text-to-Speech API routes using Deepgram
 */

import { Router } from 'express';
import type { ApiResponse, TTSRequest, TTSResponse } from '../../../shared/types';
import { textToSpeech, getSupportedVoices, isDeepgramTTSAvailable } from '../services/deepgram';
import { getCacheStats, getCacheHitRate, clearTTSCache } from '../services/tts-cache';

const router = Router();

/**
 * POST /api/tts - Convert text to speech
 */
router.post('/', async (req, res) => {
  try {
    if (!isDeepgramTTSAvailable()) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'TTS service unavailable',
        message: 'Deepgram API credentials not configured',
      };

      return res.status(503).json(response);
    }

    const { text, language, voice, speed }: TTSRequest = req.body;

    // Validate text and language
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request',
        message: 'Text is required and cannot be empty',
      };

      return res.status(400).json(response);
    }

    if (!language || typeof language !== 'string') {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request',
        message: 'Language is required',
      };

      return res.status(400).json(response);
    }

    // Trim text to remove leading/trailing whitespace
    const trimmedText = text.trim();

    console.log('🎵 TTS API Request received:', {
      text: trimmedText.substring(0, 50) + (trimmedText.length > 50 ? '...' : ''),
      language,
      voice,
      speed,
      voiceType: typeof voice
    });

    // Validate voice is valid for the language
    let validatedVoice = voice;
    if (voice) {
      try {
        const availableVoices = await getSupportedVoices(language);
        if (!availableVoices.includes(voice)) {
          console.warn(`⚠️ Voice "${voice}" not found in available voices for "${language}", using first available: ${availableVoices[0]}`);
          validatedVoice = availableVoices[0] || voice; // Fallback to first voice or keep original
        } else {
          console.log(`✅ Voice "${voice}" validated for language "${language}"`);
        }
      } catch (error) {
        console.warn('Failed to validate voice, proceeding with requested voice:', error);
        // Continue with requested voice if validation fails
      }
    }

    const ttsRequest: TTSRequest = {
      text: trimmedText,
      language,
      voice: validatedVoice,
      speed,
    };

    const audioResult = await textToSpeech(ttsRequest);

    const response: ApiResponse<TTSResponse> = {
      success: true,
      data: audioResult,
    };

    res.json(response);
  } catch (error) {
    console.error('TTS error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Text-to-speech failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

// Cache for voices by language (in-memory, 1 hour TTL)
interface VoicesCacheEntry {
  voices: string[];
  timestamp: number;
}

const voicesCache = new Map<string, VoicesCacheEntry>();
const VOICES_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * GET /api/tts/voices/:language - Get supported voices for a language
 */
router.get('/voices/:language', async (req, res) => {
  try {
    if (!isDeepgramTTSAvailable()) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'TTS service unavailable',
        message: 'Deepgram API credentials not configured',
      };

      return res.status(503).json(response);
    }

    const { language } = req.params;

    // Check cache first
    const cached = voicesCache.get(language);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < VOICES_CACHE_TTL) {
      console.log(`✅ Voices cache HIT for language: ${language}`);
      const response: ApiResponse<string[]> = {
        success: true,
        data: cached.voices,
      };
      return res.json(response);
    }

    // Fetch from API
    console.log(`🔄 Fetching voices from API for language: ${language}`);
    const voices = await getSupportedVoices(language);

    // Cache the result
    voicesCache.set(language, {
      voices,
      timestamp: now,
    });

    const response: ApiResponse<string[]> = {
      success: true,
      data: voices,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching voices:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch voices',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/tts/status - Check TTS service status
 */
router.get('/status', (req, res) => {
  const available = isDeepgramTTSAvailable();

  const response: ApiResponse<{ available: boolean }> = {
    success: true,
    data: { available },
    message: available ? 'TTS service is available' : 'TTS service is not configured',
  };

  res.json(response);
});

/**
 * GET /api/tts/cache/stats - Get TTS cache statistics
 */
router.get('/cache/stats', (req, res) => {
  const stats = getCacheStats();
  const hitRate = getCacheHitRate();

  const response: ApiResponse<{ stats: typeof stats; hitRate: number }> = {
    success: true,
    data: {
      stats,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
    },
    message: `Cache hit rate: ${hitRate.toFixed(2)}%`,
  };

  res.json(response);
});

/**
 * DELETE /api/tts/cache - Clear TTS cache
 */
router.delete('/cache', async (req, res) => {
  await clearTTSCache();

  const response: ApiResponse<{ cleared: boolean }> = {
    success: true,
    data: { cleared: true },
    message: 'TTS cache cleared successfully',
  };

  res.json(response);
});

export { router as ttsRoutes };
