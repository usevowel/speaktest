/**
 * Translation service - LLM provider agnostic translation interface
 * Currently implemented using Groq GPT-OSS-20B model
 * Documentation: https://console.groq.com/docs/model/openai/gpt-oss-20b
 */

import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import type { TranslationRequest, TranslationResponse } from '../../../shared/types';
import { getCachedTranslation, cacheTranslation } from './translation-cache';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn('⚠️  Translation API key (GROQ_API_KEY) not configured - translation will not work');
}

/**
 * Check if translation service is available
 */
export function isTranslationAvailable(): boolean {
  return !!GROQ_API_KEY;
}

/**
 * Translate text from source language to target language
 * Currently implemented using Groq GPT-OSS-20B model
 */
export async function translateText(request: TranslationRequest): Promise<TranslationResponse> {
  if (!GROQ_API_KEY) {
    throw new Error('Translation API key not configured. Please set GROQ_API_KEY in your .env file.');
  }

  // Check cache first
  const cachedResponse = await getCachedTranslation(request);
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
    // Model: openai/gpt-oss-20b - optimized for cost-efficient deployment
    console.log('🔄 Calling translation API with model: openai/gpt-oss-20b');
    
    const result = await generateText({
      model: groq('openai/gpt-oss-20b'),
      prompt,
      maxTokens: 1000,
    });

    console.log('🔄 Translation API response structure:', {
      hasText: 'text' in result,
      textType: typeof result.text,
      textLength: result.text?.length,
      textValue: result.text,
      resultKeys: Object.keys(result),
      fullResult: JSON.stringify(result, null, 2).substring(0, 500)
    });

    const translatedText = (result.text || '').trim();
    
    console.log('🔄 Translation result:', { 
      originalLength: text.length,
      translatedLength: translatedText.length,
      translatedText: translatedText.substring(0, 100),
      isEmpty: translatedText.length === 0
    });

    if (!translatedText || translatedText.length === 0) {
      console.error('❌ Translation returned empty text:', { 
        result, 
        text,
        resultText: result.text,
        resultType: typeof result,
        resultKeys: Object.keys(result)
      });
      throw new Error('Translation service returned empty text. Please check the translation API response.');
    }

    const translationResponse: TranslationResponse = {
      translatedText,
      sourceLanguage,
      targetLanguage,
    };

    // Cache the translation for future use
    await cacheTranslation(request, translationResponse);

    return translationResponse;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect language of text using translation service
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!GROQ_API_KEY) {
    console.warn('Translation API key not configured, defaulting to English');
    return 'english';
  }

  try {
    const prompt = `Detect the language of the following text and return only the language name in lowercase (e.g., "english", "spanish", "french"):
    
    Text: "${text}"`;

    const result = await generateText({
      model: groq('openai/gpt-oss-20b'),
      prompt,
      maxTokens: 50,
    });

    return result.text.trim().toLowerCase();
  } catch (error) {
    console.error('Language detection error:', error);
    return 'english'; // Default fallback
  }
}