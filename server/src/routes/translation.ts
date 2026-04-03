/**
 * Translation API routes using Groq GPT-OSS-20B
 * Documentation: https://console.groq.com/docs/model/openai/gpt-oss-20b
 */

import { Router } from 'express';
import type { ApiResponse, TranslationRequest, TranslationResponse } from '../../../shared/types';
import { translateText, detectLanguage } from '../services/translation';
import { getCacheStats, getCacheHitRate, clearTranslationCache } from '../services/translation-cache';

const router = Router();

/**
 * POST /api/translate - Translate text
 */
router.post('/', async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage }: TranslationRequest = req.body;
    
    if (!text || !targetLanguage) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request',
        message: 'Text and target language are required',
      };
      
      return res.status(400).json(response);
    }
    
    // Auto-detect source language if not provided
    const detectedSourceLanguage = sourceLanguage || await detectLanguage(text);
    
    const translationRequest: TranslationRequest = {
      text,
      sourceLanguage: detectedSourceLanguage,
      targetLanguage,
    };
    
    const translation = await translateText(translationRequest);
    
    const response: ApiResponse<TranslationResponse> = {
      success: true,
      data: translation,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Translation error:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Translation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    
    res.status(500).json(response);
  }
});

/**
 * POST /api/translate/detect - Detect language of text
 */
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request',
        message: 'Text is required',
      };
      
      return res.status(400).json(response);
    }
    
    const language = await detectLanguage(text);
    
    const response: ApiResponse<{ language: string }> = {
      success: true,
      data: { language },
    };
    
    res.json(response);
  } catch (error) {
    console.error('Language detection error:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Language detection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/translate/cache/stats - Get translation cache statistics
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
 * DELETE /api/translate/cache - Clear translation cache
 */
router.delete('/cache', async (req, res) => {
  await clearTranslationCache();
  
  const response: ApiResponse<{ cleared: boolean }> = {
    success: true,
    data: { cleared: true },
    message: 'Translation cache cleared successfully',
  };
  
  res.json(response);
});

export { router as translationRoutes };
