/**
 * Translation API handler for Cloudflare Workers
 */

import type { Request } from '@cloudflare/workers-types';
import type { Env } from '../types';
import type { TranslationRequest } from '../../../shared/types';
import { translateText, detectLanguage } from '../services/translation-workers';
import { getCacheStats, clearTranslationCache } from '../services/translation-cache-r2';
import { handleCORS, addCORSHeaders } from '../utils/cors';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleTranslation(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request, env);
  }

  // POST /api/translate - Translate text
  if (request.method === 'POST' && url.pathname === '/api/translate') {
    try {
      const body = await request.json() as TranslationRequest;
      const { text, sourceLanguage, targetLanguage } = body;
      
      if (!text || !targetLanguage) {
        return addCORSHeaders(
          errorResponse('Invalid request', 'Text and target language are required', 400),
          request,
          env
        );
      }
      
      // Auto-detect source language if not provided
      const detectedSourceLanguage = sourceLanguage || await detectLanguage(text, env);
      
      const translationRequest: TranslationRequest = {
        text,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage,
      };
      
      const translation = await translateText(translationRequest, env);
      
      return addCORSHeaders(
        jsonResponse(translation),
        request,
        env
      );
    } catch (error) {
      console.error('Translation error:', error);
      return addCORSHeaders(
        errorResponse(
          'Translation failed',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // POST /api/translate/detect - Detect language
  if (request.method === 'POST' && url.pathname === '/api/translate/detect') {
    try {
      const body = await request.json() as { text: string };
      const { text } = body;
      
      if (!text) {
        return addCORSHeaders(
          errorResponse('Invalid request', 'Text is required', 400),
          request,
          env
        );
      }
      
      const language = await detectLanguage(text, env);
      
      return addCORSHeaders(
        jsonResponse({ language }),
        request,
        env
      );
    } catch (error) {
      console.error('Language detection error:', error);
      return addCORSHeaders(
        errorResponse(
          'Language detection failed',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // GET /api/translate/cache/stats - Get cache statistics
  if (request.method === 'GET' && url.pathname === '/api/translate/cache/stats') {
    const stats = await getCacheStats(env.STORAGE);
    const hitRate = 0; // R2 doesn't track hits/misses, would need KV for this
    
    return addCORSHeaders(
      jsonResponse({ stats, hitRate }, 200, `Cache size: ${stats.size}`),
      request,
      env
    );
  }

  // DELETE /api/translate/cache - Clear cache
  if (request.method === 'DELETE' && url.pathname === '/api/translate/cache') {
    await clearTranslationCache(env.STORAGE);
    
    return addCORSHeaders(
      jsonResponse({ cleared: true }, 200, 'Translation cache cleared successfully'),
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
