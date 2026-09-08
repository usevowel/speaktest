/**
 * TTS API handler for Cloudflare Workers
 */

import type { Request } from '@cloudflare/workers-types';
import type { Env } from '../types';
import type { TTSRequest } from '../../../shared/types';
import { textToSpeech, getSupportedVoices, isFishTTSAvailable } from '../services/fish-audio-workers';
import { getCacheStats, clearTTSCache } from '../services/tts-cache-r2';
import { handleCORS, addCORSHeaders } from '../utils/cors';
import { jsonResponse, errorResponse } from '../utils/response';

// Cache for voices by language (in-memory, 1 hour TTL)
interface VoicesCacheEntry {
  voices: string[];
  timestamp: number;
}

const voicesCache = new Map<string, VoicesCacheEntry>();
const VOICES_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function handleTTS(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request, env);
  }

  // POST /api/tts - Convert text to speech
  if (request.method === 'POST' && url.pathname === '/api/tts') {
    try {
      if (!isFishTTSAvailable(env)) {
        return addCORSHeaders(
          errorResponse('TTS service unavailable', 'Fish Audio API credentials not configured', 503),
          request,
          env
        );
      }

      const body = await request.json() as TTSRequest;
      const { text, language, voice, speed } = body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return addCORSHeaders(
          errorResponse('Invalid request', 'Text is required and cannot be empty', 400),
          request,
          env
        );
      }

      if (!language || typeof language !== 'string') {
        return addCORSHeaders(
          errorResponse('Invalid request', 'Language is required', 400),
          request,
          env
        );
      }

      const trimmedText = text.trim();

      console.log('🎵 TTS API Request received:', {
        text: trimmedText.substring(0, 50) + (trimmedText.length > 50 ? '...' : ''),
        language,
        voice,
        speed
      });

      const ttsRequest: TTSRequest = {
        text: trimmedText,
        language,
        voice,
        speed,
      };

      const audioResult = await textToSpeech(ttsRequest, env);

      return addCORSHeaders(
        jsonResponse(audioResult),
        request,
        env
      );
    } catch (error) {
      console.error('TTS error:', error);
      return addCORSHeaders(
        errorResponse(
          'Text-to-speech failed',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // GET /api/tts/voices/:language - Get supported voices
  if (request.method === 'GET' && url.pathname.startsWith('/api/tts/voices/')) {
    try {
      if (!isFishTTSAvailable(env)) {
        return addCORSHeaders(
          errorResponse('TTS service unavailable', 'Fish Audio API credentials not configured', 503),
          request,
          env
        );
      }

      const language = url.pathname.split('/').pop() || '';

      // Check cache first
      const cached = voicesCache.get(language);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < VOICES_CACHE_TTL) {
        console.log(`✅ Voices cache HIT for language: ${language}`);
        return addCORSHeaders(
          jsonResponse(cached.voices),
          request,
          env
        );
      }

      // Fetch from API
      console.log(`🔄 Fetching voices from API for language: ${language}`);
      const voices = await getSupportedVoices(env);

      // Cache the result
      voicesCache.set(language, {
        voices,
        timestamp: now,
      });

      return addCORSHeaders(
        jsonResponse(voices),
        request,
        env
      );
    } catch (error) {
      console.error('Error fetching voices:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to fetch voices',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // GET /api/tts/status - Check TTS service status
  if (request.method === 'GET' && url.pathname === '/api/tts/status') {
    const available = isFishTTSAvailable(env);

    return addCORSHeaders(
      jsonResponse(
        { available },
        200,
        available ? 'TTS service is available' : 'TTS service is not configured'
      ),
      request,
      env
    );
  }

  // GET /api/tts/cache/stats - Get cache statistics
  if (request.method === 'GET' && url.pathname === '/api/tts/cache/stats') {
    const stats = await getCacheStats(env.STORAGE);
    const hitRate = 0; // R2 doesn't track hits/misses

    return addCORSHeaders(
      jsonResponse({ stats, hitRate }, 200, `Cache size: ${stats.size}`),
      request,
      env
    );
  }

  // DELETE /api/tts/cache - Clear cache
  if (request.method === 'DELETE' && url.pathname === '/api/tts/cache') {
    await clearTTSCache(env.STORAGE);

    return addCORSHeaders(
      jsonResponse({ cleared: true }, 200, 'TTS cache cleared successfully'),
      request,
      env
    );
  }

  return addCORSHeaders(
    errorResponse('Not Found', `Route ${url.pathname} not found`, 404),
    request,
    env
  );
}
