/**
 * Shared constants for vowel.to tester
 */

import type { TTSLanguage, STTLanguage, LanguageMapping } from './types';

/** TTS Language options */
export const TTS_LANGUAGES: TTSLanguage[] = [
  'en-us', 'en-gb', 'ja', 'zh', 'es', 'fr', 'de', 'it', 'pt-br', 'ko', 'hi'
];

/** Languages supported by AssemblyAI STT Streaming */
export const ASSEMBLYAI_STT_STREAMING_LANGUAGES: readonly STTLanguage[] = [
  'english',
  'spanish',
  'french',
  'german',
  'italian',
  'portuguese'
] as const;

/** STT Language options */
export const STT_LANGUAGES: STTLanguage[] = [
  'english', 'chinese', 'german', 'spanish', 'russian', 'korean', 'french',
  'japanese', 'portuguese', 'turkish', 'polish', 'catalan', 'dutch', 'arabic',
  'swedish', 'italian', 'indonesian', 'hindi', 'finnish', 'vietnamese', 'hebrew',
  'ukrainian', 'greek', 'malay', 'czech', 'romanian', 'danish', 'hungarian',
  'tamil', 'norwegian', 'thai', 'urdu', 'croatian', 'bulgarian', 'lithuanian',
  'latin', 'maori', 'malayalam', 'welsh', 'slovak', 'telugu', 'persian',
  'latvian', 'bengali', 'serbian', 'azerbaijani', 'slovenian', 'kannada',
  'estonian', 'macedonian', 'breton', 'basque', 'icelandic', 'armenian',
  'nepali', 'mongolian', 'bosnian', 'kazakh', 'albanian', 'swahili',
  'galician', 'marathi', 'punjabi', 'sinhala', 'khmer', 'shona', 'yoruba',
  'somali', 'afrikaans', 'occitan', 'georgian', 'belarusian', 'tajik',
  'sindhi', 'gujarati', 'amharic', 'yiddish', 'lao', 'uzbek', 'faroese',
  'haitian creole', 'pashto', 'turkmen', 'nynorsk', 'maltese', 'sanskrit',
  'luxembourgish', 'myanmar', 'tibetan', 'tagalog', 'malagasy', 'assamese',
  'tatar', 'hawaiian', 'lingala', 'hausa', 'bashkir', 'javanese', 'sundanese',
  'cantonese', 'burmese', 'valencian', 'flemish', 'haitian', 'letzeburgesch',
  'pushto', 'panjabi', 'moldavian', 'moldovan', 'sinhalese', 'castilian', 'mandarin'
];

/** Language mappings for display */
export const TTS_LANGUAGE_MAPPINGS: Record<TTSLanguage, LanguageMapping> = {
  'en-us': { code: 'en-us', name: 'English (US)', nativeName: 'English (US)' },
  'en-gb': { code: 'en-gb', name: 'English (UK)', nativeName: 'English (UK)' },
  'ja': { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  'zh': { code: 'zh', name: 'Chinese', nativeName: '中文' },
  'es': { code: 'es', name: 'Spanish', nativeName: 'Español' },
  'fr': { code: 'fr', name: 'French', nativeName: 'Français' },
  'de': { code: 'de', name: 'German', nativeName: 'Deutsch' },
  'it': { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  'pt-br': { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  'ko': { code: 'ko', name: 'Korean', nativeName: '한국어' },
  'hi': { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
};

/** Map TTS language codes to translation language names */
export const TTS_TO_TRANSLATION_LANGUAGE: Record<TTSLanguage, string> = {
  'en-us': 'english',
  'en-gb': 'english',
  'ja': 'japanese',
  'zh': 'chinese',
  'es': 'spanish',
  'fr': 'french',
  'de': 'german',
  'it': 'italian',
  'pt-br': 'portuguese',
  'ko': 'korean',
  'hi': 'hindi'
};

/** Common source languages for translation */
export const SOURCE_LANGUAGES = [
  'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'chinese', 'japanese', 'korean', 'hindi'
];

/** Default application settings */
export const DEFAULT_SETTINGS = {
  TTS_LANGUAGE: 'en-us' as TTSLanguage,
  STT_LANGUAGE: 'english' as STTLanguage,
  SOURCE_LANGUAGE: 'english',
  VAD_SENSITIVITY: 0.5,
  MAX_RECORDING_DURATION: 30000, // 30 seconds
  MIN_SILENCE_DURATION: 1000, // 1 second
};

/** API endpoints */
export const API_ENDPOINTS = {
  PROJECTS: '/api/projects',
  TRANSLATE: '/api/translate',
  TTS: '/api/tts',
  STT: '/api/stt',
  TRANSCRIPTIONS: '/api/transcriptions',
} as const;

/** Audio configuration */
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
} as const;

/** Keyboard shortcuts */
export const KEYBOARD_SHORTCUTS = {
  NEXT_PHRASE: 'ArrowDown',
  PREV_PHRASE: 'ArrowUp',
  PLAY_PHRASE: 'Space',
  TOGGLE_LISTENING: 'KeyL',
} as const;
