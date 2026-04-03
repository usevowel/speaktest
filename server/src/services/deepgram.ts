/**
 * Deepgram API service for STT and TTS
 * Documentation:
 * - STT: https://developers.deepgram.com/docs/getting-started-with-pre-recorded-audio
 * - TTS: https://developers.deepgram.com/docs/text-to-speech
 */

import fetch from 'node-fetch';
import type { TTSRequest, TTSResponse, STTRequest, STTResponse } from '../../../shared/types';
import { getCachedTTS, cacheTTS } from './tts-cache';

// Deepgram API Configuration
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

// API Endpoints
const STT_ENDPOINT = 'https://api.deepgram.com/v1/listen';
const TTS_ENDPOINT = 'https://api.deepgram.com/v1/speak';

if (!DEEPGRAM_API_KEY) {
  console.warn('⚠️  Deepgram API key (DEEPGRAM_API_KEY) not configured');
}

/**
 * Map language codes to Deepgram format (ISO 639-1)
 * Based on Deepgram Aura TTS supported languages:
 * - English (en): en-us, en-gb, en-au, en-ie, en-ph
 * - Spanish (es): es-mx, es-es, es-co, es-419
 * - German (de): de-de
 * - French (fr): fr-fr
 * - Italian (it): it-it
 * - Japanese (ja): ja-jp
 * - Dutch (nl): nl-nl
 *
 * Reference: https://developers.deepgram.com/docs/tts-models
 */
function mapLanguageToDeepgram(language: string): string {
  const languageMap: Record<string, string> = {
    // English variants
    'en': 'en',
    'en-us': 'en',
    'en-gb': 'en',
    'en-au': 'en',
    'en-ie': 'en',
    'en-ph': 'en',
    // Spanish variants
    'es': 'es',
    'es-mx': 'es',
    'es-es': 'es',
    'es-co': 'es',
    'es-419': 'es',
    // Other supported languages
    'de': 'de',
    'fr': 'fr',
    'it': 'it',
    'ja': 'ja',
    'nl': 'nl',
    // Legacy/unmapped fallbacks (not supported by TTS but kept for STT compatibility)
    'zh': 'zh',
    'zh-cn': 'zh',
    'hi': 'hi',
    'pt': 'pt',
    'pt-br': 'pt',
    'ko': 'ko',
    'pl': 'pl',
    'ru': 'ru',
    'tr': 'tr',
    'sv': 'sv',
    'da': 'da',
    'no': 'no',
    'fi': 'fi',
  };

  return languageMap[language.toLowerCase()] || language.split('-')[0];
}

/**
 * Get Deepgram voice model for TTS
 * Returns language-appropriate featured voices based on Deepgram's recommendations
 * Reference: https://developers.deepgram.com/docs/tts-models
 * Aura-2 models offer the highest quality
 */
function getVoiceForLanguage(language: string, requestedVoice?: string): string {
  // If a specific voice is requested, use it
  if (requestedVoice) {
    return requestedVoice;
  }

  // Default voice mapping with featured voices for each supported language
  const languageVoiceMap: Record<string, string> = {
    // English variants - use featured voices
    'en': 'aura-2-thalia-en',         // Featured American female
    'en-us': 'aura-2-thalia-en',      // Featured American female
    'en-gb': 'aura-2-draco-en',       // British male (warm, baritone)
    'en-au': 'aura-2-hyperion-en',    // Australian male (caring, warm)
    'en-ie': 'aura-2-thalia-en',      // No specific Irish voice, use general English
    'en-ph': 'aura-2-amalthea-en',    // Filipino female (engaging, natural)
    // Spanish variants - use featured voices
    'es': 'aura-2-celeste-es',         // Featured Colombian female
    'es-mx': 'aura-2-estrella-es',    // Featured Mexican female
    'es-es': 'aura-2-nestor-es',       // Featured Peninsular male
    'es-co': 'aura-2-celeste-es',      // Featured Colombian female
    'es-419': 'aura-2-aquila-es',     // Latin American male
    // Other supported languages - use featured voices
    'de': 'aura-2-viktoria-de',       // Featured German female (charismatic)
    'fr': 'aura-2-agathe-fr',          // Featured French female (charismatic)
    'it': 'aura-2-livia-it',          // Featured Italian female (approachable)
    'ja': 'aura-2-izanami-ja',        // Featured Japanese female (approachable)
    'nl': 'aura-2-rhea-nl',           // Featured Dutch female (caring)
    // Legacy fallbacks (not primary TTS languages but kept for compatibility)
    'zh': 'aura-2-thalia-en',
    'hi': 'aura-2-thalia-en',
    'pt': 'aura-2-thalia-en',
    'pt-br': 'aura-2-thalia-en',
    'ko': 'aura-2-thalia-en',
  };

  return languageVoiceMap[language.toLowerCase()] || 'aura-2-thalia-en';
}

/**
 * Convert text to speech using Deepgram
 * API Documentation: https://developers.deepgram.com/docs/text-to-speech
 * Note: The API returns MP3 audio as a binary stream
 *
 * Implements caching to avoid regenerating audio for identical requests
 */
export async function textToSpeech(request: TTSRequest): Promise<TTSResponse> {
  try {
    // Check cache first
    const cachedResponse = await getCachedTTS(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const { text, language, voice, speed = 1.0 } = request;

    // Get appropriate voice for the language
    const selectedVoice = getVoiceForLanguage(language, voice);

    console.log('Deepgram TTS:', { language, requestedVoice: voice, selectedVoice, speed });

    // Deepgram TTS API call
    // Authorization uses Token format: Token {api_key}
    const url = new URL(`${TTS_ENDPOINT}?model=${selectedVoice}`);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      },
      body: JSON.stringify({
        text: text.trim(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // The API returns the audio file directly as a binary stream
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64 data URL for client-side playback
    // Deepgram returns MP3 format by default
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

    const ttsResponse: TTSResponse = {
      audioUrl,
      duration: undefined, // Duration not provided by API, will be determined by client
    };

    // Cache the response for future requests
    await cacheTTS(request, ttsResponse);

    return ttsResponse;
  } catch (error) {
    console.error('TTS error:', error);
    throw new Error(`Text-to-speech failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert speech to text using Deepgram
 * API Documentation: https://developers.deepgram.com/docs/getting-started-with-pre-recorded-audio
 */
export async function speechToText(request: STTRequest): Promise<STTResponse> {
  try {
    const { audioData, language } = request;

    // Map language to Deepgram format
    const deepgramLanguage = language ? mapLanguageToDeepgram(language) : 'en';

    // Build URL with query parameters
    const url = new URL(STT_ENDPOINT);
    url.searchParams.append('model', 'nova-3');  // Latest model with best accuracy
    url.searchParams.append('smart_format', 'true');  // Format currency, phone numbers, etc.
    if (deepgramLanguage !== 'en') {
      url.searchParams.append('language', deepgramLanguage);
    }

    // Convert Blob to Buffer for node-fetch compatibility
    const audioBuffer = await audioData.arrayBuffer();
    const audioBufferNode = Buffer.from(audioBuffer);

    // Deepgram STT API call
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/webm',  // Adjust based on actual audio format
      },
      body: audioBufferNode,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`STT API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json() as any;

    // Extract transcript from Deepgram response structure
    // Response structure: results.channels[0].alternatives[0].transcript
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0.95;

    return {
      text: transcript,
      confidence: confidence,
      language: language || 'unknown',
    };
  } catch (error) {
    console.error('STT error:', error);
    throw new Error(`Speech-to-text failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if Deepgram STT service is available
 */
export function isDeepgramSTTAvailable(): boolean {
  return !!DEEPGRAM_API_KEY;
}

/**
 * Check if Deepgram TTS service is available
 */
export function isDeepgramTTSAvailable(): boolean {
  return !!DEEPGRAM_API_KEY;
}

/**
 * Get supported voices for TTS
 * Returns all available Deepgram Aura-2 and Aura-1 voices
 * Reference: https://developers.deepgram.com/docs/tts-models
 */
export async function getSupportedVoices(_language?: string): Promise<string[]> {
  // Aura-2 voices organized by language support
  // English (en-us, en-gb, en-au, en-ph, en-ie) - 42 voices
  const aura2EnglishVoices = [
    // Featured English voices
    'aura-2-thalia-en',       // Female - Clear, Confident, Energetic, Enthusiastic (US)
    'aura-2-andromeda-en',    // Female - Casual, Expressive, Comfortable (US)
    'aura-2-helena-en',       // Female - Caring, Natural, Positive, Friendly, Raspy (US)
    'aura-2-apollo-en',       // Male - Confident, Comfortable, Casual (US)
    'aura-2-arcas-en',        // Male - Natural, Smooth, Clear, Comfortable (US)
    'aura-2-aries-en',        // Male - Warm, Energetic, Caring (US)
    // Other en-us voices
    'aura-2-amalthea-en',     // Female - Engaging, Natural, Cheerful (Filipino)
    'aura-2-asteria-en',      // Female - Clear, Confident, Knowledgeable, Energetic (US)
    'aura-2-athena-en',       // Female - Calm, Smooth, Professional (US)
    'aura-2-atlas-en',        // Male - Enthusiastic, Confident, Approachable (US)
    'aura-2-aurora-en',       // Female - Cheerful, Expressive, Energetic (US)
    'aura-2-callista-en',     // Female - Clear, Energetic, Professional, Smooth (US)
    'aura-2-cora-en',         // Female - Smooth, Melodic, Caring (US)
    'aura-2-cordelia-en',     // Female - Approachable, Warm, Polite (US)
    'aura-2-delia-en',        // Female - Casual, Friendly, Cheerful, Breathy (US)
    'aura-2-draco-en',        // Male - Warm, Approachable, Trustworthy, Baritone (British)
    'aura-2-electra-en',      // Female - Professional, Engaging, Knowledgeable (US)
    'aura-2-harmonia-en',     // Female - Empathetic, Clear, Calm, Confident (US)
    'aura-2-hera-en',         // Female - Smooth, Warm, Professional (US)
    'aura-2-hermes-en',       // Male - Expressive, Engaging, Professional (US)
    'aura-2-hyperion-en',     // Male - Caring, Warm, Empathetic (Australian)
    'aura-2-iris-en',         // Female - Cheerful, Positive, Approachable (US)
    'aura-2-janus-en',        // Female - Southern, Smooth, Trustworthy (US)
    'aura-2-juno-en',         // Female - Natural, Engaging, Melodic, Breathy (US)
    'aura-2-jupiter-en',      // Male - Expressive, Knowledgeable, Baritone (US)
    'aura-2-luna-en',         // Female - Friendly, Natural, Engaging (US)
    'aura-2-mars-en',         // Male - Smooth, Patient, Trustworthy, Baritone (US)
    'aura-2-minerva-en',      // Female - Positive, Friendly, Natural (US)
    'aura-2-neptune-en',      // Male - Professional, Patient, Polite (US)
    'aura-2-odysseus-en',     // Male - Calm, Smooth, Comfortable, Professional (US)
    'aura-2-ophelia-en',      // Female - Expressive, Enthusiastic, Cheerful (US)
    'aura-2-orion-en',        // Male - Approachable, Comfortable, Calm, Polite (US)
    'aura-2-orpheus-en',      // Male - Professional, Clear, Confident, Trustworthy (US)
    'aura-2-pandora-en',      // Female - Smooth, Calm, Melodic, Breathy (British)
    'aura-2-phoebe-en',       // Female - Energetic, Warm, Casual (US)
    'aura-2-pluto-en',        // Male - Smooth, Calm, Empathetic, Baritone (US)
    'aura-2-saturn-en',       // Male - Knowledgeable, Confident, Baritone (US)
    'aura-2-selene-en',       // Female - Expressive, Engaging, Energetic (US)
    'aura-2-theia-en',        // Female - Expressive, Polite, Sincere (Australian)
    'aura-2-zeus-en',         // Male - Deep, Trustworthy, Smooth (US)
  ];

  // Spanish voices (es-mx, es-es, es-co, es-419) - 16 voices
  const aura2SpanishVoices = [
    // Featured Spanish voices
    'aura-2-celeste-es',      // Female - Clear, Energetic, Positive, Friendly (Colombian)
    'aura-2-estrella-es',     // Female - Approachable, Natural, Calm, Comfortable (Mexican)
    'aura-2-nestor-es',       // Male - Calm, Professional, Approachable, Clear (Peninsular)
    // Other Spanish voices
    'aura-2-sirio-es',        // Male - Calm, Professional, Comfortable, Empathetic (Mexican)
    'aura-2-carina-es',       // Female - Professional, Raspy, Energetic, Breathy (Peninsular)
    'aura-2-alvaro-es',       // Male - Calm, Professional, Clear, Knowledgeable (Peninsular)
    'aura-2-diana-es',        // Female - Professional, Confident, Expressive, Polite (Peninsular)
    'aura-2-aquila-es',       // Male - Expressive, Enthusiastic, Confident, Casual (Latin American)
    'aura-2-selena-es',       // Female - Approachable, Casual, Friendly, Calm (Latin American)
    'aura-2-javier-es',       // Male - Approachable, Professional, Friendly, Comfortable (Mexican)
    'aura-2-agustina-es',     // Female - Calm, Clear, Expressive, Knowledgeable (Peninsular)
    'aura-2-antonia-es',      // Female - Approachable, Enthusiastic, Friendly, Natural (Argentine)
    'aura-2-gloria-es',       // Female - Casual, Clear, Expressive, Natural (Colombian)
    'aura-2-luciano-es',      // Male - Charismatic, Cheerful, Energetic, Expressive (Mexican)
    'aura-2-olivia-es',       // Female - Breathy, Calm, Casual, Expressive (Mexican)
    'aura-2-silvia-es',       // Female - Charismatic, Clear, Expressive, Natural (Peninsular)
    'aura-2-valerio-es',      // Male - Deep, Knowledgeable, Natural, Polite (Mexican)
  ];

  // German voices (de-de) - 7 voices
  const aura2GermanVoices = [
    'aura-2-julius-de',       // Male - Casual, Cheerful, Engaging, Expressive
    'aura-2-viktoria-de',     // Female - Charismatic, Cheerful, Enthusiastic, Friendly
    'aura-2-elara-de',        // Female - Calm, Clear, Natural, Patient
    'aura-2-aurelia-de',      // Female - Approachable, Casual, Comfortable, Natural
    'aura-2-lara-de',         // Female - Caring, Cheerful, Empathetic, Expressive
    'aura-2-fabian-de',       // Male - Confident, Knowledgeable, Natural, Polite
    'aura-2-kara-de',         // Female - Caring, Empathetic, Expressive, Professional
  ];

  // French voices (fr-fr) - 2 voices
  const aura2FrenchVoices = [
    'aura-2-agathe-fr',       // Female - Charismatic, Cheerful, Enthusiastic, Friendly
    'aura-2-hector-fr',       // Male - Confident, Empathetic, Expressive, Friendly
  ];

  // Italian voices (it-it) - 10 voices
  const aura2ItalianVoices = [
    'aura-2-livia-it',        // Female - Approachable, Cheerful, Clear, Engaging
    'aura-2-dionisio-it',     // Male - Confident, Engaging, Friendly, Melodic
    'aura-2-melia-it',        // Female - Clear, Comfortable, Engaging, Friendly
    'aura-2-elio-it',         // Male - Breathy, Calm, Professional, Smooth
    'aura-2-flavio-it',       // Male - Confident, Deep, Empathetic, Professional
    'aura-2-maia-it',         // Female - Caring, Energetic, Expressive, Professional
    'aura-2-cinzia-it',       // Female - Approachable, Friendly, Smooth, Trustworthy
    'aura-2-cesare-it',       // Male - Clear, Empathetic, Knowledgeable, Natural
    'aura-2-perseo-it',       // Male - Casual, Clear, Natural, Polite
    'aura-2-demetra-it',      // Female - Calm, Comfortable, Patient
  ];

  // Japanese voices (ja-jp) - 5 voices
  const aura2JapaneseVoices = [
    'aura-2-fujin-ja',        // Male - Calm, Confident, Knowledgeable, Professional
    'aura-2-izanami-ja',      // Female - Approachable, Clear, Knowledgeable, Polite
    'aura-2-uzume-ja',        // Female - Approachable, Clear, Polite, Professional
    'aura-2-ebisu-ja',        // Male - Calm, Deep, Natural, Patient
    'aura-2-ama-ja',          // Female - Casual, Comfortable, Confident, Knowledgeable
  ];

  // Dutch voices (nl-nl) - 10 voices
  const aura2DutchVoices = [
    'aura-2-rhea-nl',         // Female - Caring, Knowledgeable, Positive, Smooth
    'aura-2-sander-nl',       // Male - Calm, Clear, Deep, Professional
    'aura-2-beatrix-nl',      // Female - Cheerful, Enthusiastic, Friendly, Trustworthy
    'aura-2-daphne-nl',       // Female - Calm, Clear, Confident, Professional
    'aura-2-cornelia-nl',     // Female - Approachable, Friendly, Polite, Positive
    'aura-2-hestia-nl',       // Female - Approachable, Caring, Expressive, Friendly
    'aura-2-lars-nl',         // Male - Breathy, Casual, Comfortable, Sincere
    'aura-2-roman-nl',        // Male - Calm, Casual, Deep, Natural
    'aura-2-leda-nl',         // Female - Caring, Comfortable, Empathetic, Friendly
  ];

  // Legacy Aura-1 voices (English only)
  const aura1Voices = [
    'aura-asteria-en',
    'aura-luna-en',
    'aura-orion-en',
    'aura-arcas-en',
    'aura-athena-en',
    'aura-helios-en',
    'aura-hera-en',
    'aura-perseus-en',
    'aura-angus-en',
    'aura-orpheus-en',
    'aura-zeus-en',
  ];

  return [
    ...aura2EnglishVoices,
    ...aura2SpanishVoices,
    ...aura2GermanVoices,
    ...aura2FrenchVoices,
    ...aura2ItalianVoices,
    ...aura2JapaneseVoices,
    ...aura2DutchVoices,
    ...aura1Voices,
  ];
}
