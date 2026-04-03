/**
 * Translation service - LLM provider agnostic translation interface
 * Currently implemented using Groq GPT-OSS-20B model
 * Updated for Cloudflare Workers
 */

import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import type { TranslationRequest, TranslationResponse } from '../../../shared/types';
import { getCachedTranslation, cacheTranslation } from './translation-cache-r2';
import type { Env } from '../types';

/**
 * Check if translation service is available
 */
export function isTranslationAvailable(env: Env): boolean {
  return !!env.GROQ_API_KEY;
}

/**
 * Translate text from source language to target language
 * Currently implemented using Groq GPT-OSS-20B model
 */
export async function translateText(
  request: TranslationRequest,
  env: Env
): Promise<TranslationResponse> {
  if (!env.GROQ_API_KEY) {
    throw new Error('Translation API key not configured. Please set GROQ_API_KEY secret.');
  }

  // Check cache first
  const cachedResponse = await getCachedTranslation(request, env.STORAGE);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const { text, sourceLanguage, targetLanguage } = request;

    console.log('🔄 Translation request:', { 
      text: text.substring(0, 50), 
      sourceLanguage, 
      targetLanguage 
    });

    // Create translation prompt - be very explicit
    const prompt = `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}.

IMPORTANT: Return ONLY the translated text. Do not include any explanations, notes, or additional text.

Source text (${sourceLanguage}): "${text}"

Translation (${targetLanguage}):`;

    // Use LLM provider for translation (currently Groq GPT-OSS-20B)
    // Create Groq provider with API key from env
    console.log('🔄 Calling translation API with model: openai/gpt-oss-20b');
    
    const groqProvider = createGroq({
      apiKey: env.GROQ_API_KEY,
    });
    
    const result = await generateText({
      model: groqProvider('openai/gpt-oss-20b'),
      prompt,
    });

    const translatedText = (result.text || '').trim();
    
    console.log('🔄 Translation result:', { 
      originalLength: text.length,
      translatedLength: translatedText.length,
      translatedText: translatedText.substring(0, 100),
      isEmpty: translatedText.length === 0
    });

    if (!translatedText || translatedText.length === 0) {
      console.error('❌ Translation returned empty text');
      throw new Error('Translation service returned empty text. Please check the translation API response.');
    }

    const translationResponse: TranslationResponse = {
      translatedText,
      sourceLanguage,
      targetLanguage,
    };

    // Cache the translation for future use
    await cacheTranslation(request, translationResponse, env.STORAGE);

    return translationResponse;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect language of text using translation service
 */
export async function detectLanguage(text: string, env: Env): Promise<string> {
  if (!env.GROQ_API_KEY) {
    console.warn('Translation API key not configured, defaulting to English');
    return 'english';
  }

  try {
    const prompt = `Detect the language of the following text and return only the language name in lowercase (e.g., "english", "spanish", "french"):
    
    Text: "${text}"`;

    const groqProvider = createGroq({
      apiKey: env.GROQ_API_KEY,
    });
    
    const result = await generateText({
      model: groqProvider('openai/gpt-oss-20b'),
      prompt,
    });

    return result.text.trim().toLowerCase();
  } catch (error) {
    console.error('Language detection error:', error);
    return 'english'; // Default fallback
  }
}
