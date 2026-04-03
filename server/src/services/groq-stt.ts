/**
 * Groq Whisper API service for Speech-to-Text
 * Documentation: https://console.groq.com/docs/speech-to-text
 */

import type { STTRequest, STTResponse } from '../../../shared/types';
import type { Env } from '../types';

// GROQ API Configuration
const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1';
const STT_ENDPOINT = `${GROQ_API_BASE_URL}/audio/transcriptions`;

// Whisper model options:
// - 'whisper-large-v3': Best quality, multilingual
// - 'whisper-large-v3-turbo': Faster, balanced quality
// - 'distil-whisper-large-v3-en': Fastest, English-only
const WHISPER_MODEL = 'whisper-large-v3-turbo';

/**
 * Map language codes from our STTLanguage type to ISO 639-1 codes for Whisper
 * Whisper supports auto-detection, but specifying language improves accuracy
 */
function mapLanguageToISO6391(language: string): string | undefined {
  const languageMap: Record<string, string> = {
    'english': 'en',
    'chinese': 'zh',
    'german': 'de',
    'spanish': 'es',
    'russian': 'ru',
    'korean': 'ko',
    'french': 'fr',
    'japanese': 'ja',
    'portuguese': 'pt',
    'turkish': 'tr',
    'polish': 'pl',
    'catalan': 'ca',
    'dutch': 'nl',
    'arabic': 'ar',
    'swedish': 'sv',
    'italian': 'it',
    'indonesian': 'id',
    'hindi': 'hi',
    'finnish': 'fi',
    'vietnamese': 'vi',
    'hebrew': 'he',
    'ukrainian': 'uk',
    'greek': 'el',
    'malay': 'ms',
    'czech': 'cs',
    'romanian': 'ro',
    'danish': 'da',
    'hungarian': 'hu',
    'tamil': 'ta',
    'norwegian': 'no',
    'thai': 'th',
    'urdu': 'ur',
    'croatian': 'hr',
    'bulgarian': 'bg',
    'lithuanian': 'lt',
    'latvian': 'lv',
    'serbian': 'sr',
    'slovenian': 'sl',
    'estonian': 'et',
    'macedonian': 'mk',
    'icelandic': 'is',
    'armenian': 'hy',
    'nepali': 'ne',
    'mongolian': 'mn',
    'bosnian': 'bs',
    'kazakh': 'kk',
    'albanian': 'sq',
    'swahili': 'sw',
    'galician': 'gl',
    'marathi': 'mr',
    'punjabi': 'pa',
    'sinhala': 'si',
    'khmer': 'km',
    'yoruba': 'yo',
    'somali': 'so',
    'afrikaans': 'af',
    'georgian': 'ka',
    'belarusian': 'be',
    'tajik': 'tg',
    'sindhi': 'sd',
    'gujarati': 'gu',
    'amharic': 'am',
    'yiddish': 'yi',
    'lao': 'lo',
    'uzbek': 'uz',
    'faroese': 'fo',
    'haitian creole': 'ht',
    'pashto': 'ps',
    'turkmen': 'tk',
    'nynorsk': 'nn',
    'maltese': 'mt',
    'sanskrit': 'sa',
    'luxembourgish': 'lb',
    'myanmar': 'my',
    'tibetan': 'bo',
    'tagalog': 'tl',
    'malagasy': 'mg',
    'assamese': 'as',
    'tatar': 'tt',
    'hawaiian': 'haw',
    'lingala': 'ln',
    'hausa': 'ha',
    'bashkir': 'ba',
    'javanese': 'jv',
    'sundanese': 'su',
    'cantonese': 'zh',
    'burmese': 'my',
    'valencian': 'ca',
    'flemish': 'nl',
    'haitian': 'ht',
    'letzeburgesch': 'lb',
    'pushto': 'ps',
    'panjabi': 'pa',
    'moldavian': 'ro',
    'moldovan': 'ro',
    'sinhalese': 'si',
    'castilian': 'es',
    'mandarin': 'zh',
    'maori': 'mi',
    'malayalam': 'ml',
    'welsh': 'cy',
    'slovak': 'sk',
    'telugu': 'te',
    'persian': 'fa',
    'bengali': 'bn',
    'kannada': 'kn',
    'breton': 'br',
    'basque': 'eu',
    'occitan': 'oc',
  };

  return languageMap[language.toLowerCase()];
}

/**
 * Convert speech to text using Groq Whisper API
 * API Documentation: https://console.groq.com/docs/speech-to-text
 */
export async function speechToText(
  request: STTRequest,
  env: Env
): Promise<STTResponse> {
  if (!env.GROQ_API_KEY) {
    throw new Error('Groq API key not configured. Please set GROQ_API_KEY secret.');
  }

  try {
    const { audioData, language } = request;

    // Create FormData for audio upload (OpenAI-compatible format)
    const formData = new FormData();
    formData.append('file', audioData, 'audio.webm');
    formData.append('model', WHISPER_MODEL);
    
    // Map language to ISO 639-1 code if available
    const languageCode = language ? mapLanguageToISO6391(language) : undefined;
    if (languageCode) {
      formData.append('language', languageCode);
    }
    
    // Optional parameters for better performance
    formData.append('response_format', 'json');
    formData.append('temperature', '0'); // Lower temperature for more consistent results

    console.log('🔄 Calling Groq Whisper API:', {
      model: WHISPER_MODEL,
      language: languageCode || 'auto-detect',
      originalLanguage: language,
    });

    const response = await fetch(STT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        // Don't set Content-Type - let fetch set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq STT API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json() as any;

    console.log('🔄 Groq Whisper response:', {
      textLength: result.text?.length,
      textPreview: result.text?.substring(0, 100),
    });

    return {
      text: result.text || '',
      confidence: result.confidence || 0.95, // Whisper doesn't return confidence, use default
      language: language || 'unknown',
    };
  } catch (error) {
    console.error('Groq STT error:', error);
    throw new Error(`Speech-to-text failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if Groq STT service is available
 */
export function isGroqSTTAvailable(env: Env): boolean {
  return !!env.GROQ_API_KEY;
}
