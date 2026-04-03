/**
 * Shared constants for vowel.to tester
 */

import type { TTSLanguage, STTLanguage, LanguageMapping } from './types';

/** TTS Language options - based on Deepgram Aura TTS models
 * Reference: https://developers.deepgram.com/docs/tts-models
 * Supported: English (US, GB, AU, IE, PH), Spanish (MX, ES, CO, 419), German, French, Italian, Japanese, Dutch
 */
export const TTS_LANGUAGES: TTSLanguage[] = [
  // English variants
  'en-us', 'en-gb', 'en-au', 'en-ie', 'en-ph',
  // Spanish variants
  'es', 'es-mx', 'es-es', 'es-co', 'es-419',
  // Other supported languages
  'de', 'fr', 'it', 'ja', 'nl'
];

/** Languages supported by AssemblyAI STT Streaming - filtered to match TTS support */
export const ASSEMBLYAI_STT_STREAMING_LANGUAGES: readonly STTLanguage[] = [
  'english',
  'spanish',
  'french',
  'german',
  'italian',
  'dutch'
] as const;

/** STT Language options - filtered to match TTS support
 * Only languages that have both STT and TTS support are included
 * Reference: https://developers.deepgram.com/docs/tts-models
 */
export const STT_LANGUAGES: STTLanguage[] = [
  'english', 'spanish', 'german', 'french', 'italian', 'japanese', 'dutch'
];

/** Language mappings for display - based on Deepgram Aura TTS models */
export const TTS_LANGUAGE_MAPPINGS: Record<TTSLanguage, LanguageMapping> = {
  // English variants
  'en-us': { code: 'en-us', name: 'English (US)', nativeName: 'English (US)' },
  'en-gb': { code: 'en-gb', name: 'English (UK)', nativeName: 'English (UK)' },
  'en-au': { code: 'en-au', name: 'English (Australian)', nativeName: 'English (AU)' },
  'en-ie': { code: 'en-ie', name: 'English (Irish)', nativeName: 'English (IE)' },
  'en-ph': { code: 'en-ph', name: 'English (Filipino)', nativeName: 'English (PH)' },
  // Spanish variants
  'es': { code: 'es', name: 'Spanish (General)', nativeName: 'Español' },
  'es-mx': { code: 'es-mx', name: 'Spanish (Mexican)', nativeName: 'Español (MX)' },
  'es-es': { code: 'es-es', name: 'Spanish (Peninsular)', nativeName: 'Español (ES)' },
  'es-co': { code: 'es-co', name: 'Spanish (Colombian)', nativeName: 'Español (CO)' },
  'es-419': { code: 'es-419', name: 'Spanish (Latin American)', nativeName: 'Español (LatAm)' },
  // Other supported languages
  'de': { code: 'de', name: 'German', nativeName: 'Deutsch' },
  'fr': { code: 'fr', name: 'French', nativeName: 'Français' },
  'it': { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  'ja': { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  'nl': { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' }
};

/** Map TTS language codes to translation language names */
export const TTS_TO_TRANSLATION_LANGUAGE: Record<TTSLanguage, string> = {
  // English variants
  'en-us': 'english',
  'en-gb': 'english',
  'en-au': 'english',
  'en-ie': 'english',
  'en-ph': 'english',
  // Spanish variants
  'es': 'spanish',
  'es-mx': 'spanish',
  'es-es': 'spanish',
  'es-co': 'spanish',
  'es-419': 'spanish',
  // Other supported languages
  'de': 'german',
  'fr': 'french',
  'it': 'italian',
  'ja': 'japanese',
  'nl': 'dutch'
};

/** Common source languages for translation - aligned with Deepgram TTS support */
export const SOURCE_LANGUAGES = [
  'english', 'spanish', 'french', 'german', 'italian', 'japanese', 'dutch'
];

/**
 * TTS Voice mappings by language
 * Deepgram Aura-2 voices organized by supported language
 * Reference: https://developers.deepgram.com/docs/tts-models
 */
export const TTS_VOICES: Record<TTSLanguage, string[]> = {
  // English (US) - en-us
  'en-us': [
    'aura-2-thalia-en', 'aura-2-andromeda-en', 'aura-2-helena-en',
    'aura-2-apollo-en', 'aura-2-arcas-en', 'aura-2-aries-en',
    'aura-2-asteria-en', 'aura-2-athena-en', 'aura-2-atlas-en',
    'aura-2-aurora-en', 'aura-2-callista-en', 'aura-2-cora-en',
    'aura-2-cordelia-en', 'aura-2-delia-en', 'aura-2-electra-en',
    'aura-2-harmonia-en', 'aura-2-hera-en', 'aura-2-hermes-en',
    'aura-2-iris-en', 'aura-2-janus-en', 'aura-2-juno-en',
    'aura-2-jupiter-en', 'aura-2-luna-en', 'aura-2-mars-en',
    'aura-2-minerva-en', 'aura-2-neptune-en', 'aura-2-odysseus-en',
    'aura-2-ophelia-en', 'aura-2-orion-en', 'aura-2-orpheus-en',
    'aura-2-phoebe-en', 'aura-2-pluto-en', 'aura-2-saturn-en',
    'aura-2-selene-en', 'aura-2-zeus-en'
  ],
  // English (UK) - en-gb
  'en-gb': [
    'aura-2-draco-en', 'aura-2-pandora-en', 'aura-2-helios-en', 'aura-2-athena-en',
    'aura-2-thalia-en', 'aura-2-orion-en', 'aura-2-arcas-en'
  ],
  // English (Australian) - en-au
  'en-au': [
    'aura-2-hyperion-en', 'aura-2-theia-en',
    'aura-2-thalia-en', 'aura-2-orion-en', 'aura-2-arcas-en'
  ],
  // English (Irish) - en-ie
  'en-ie': [
    'aura-2-thalia-en', 'aura-2-orion-en', 'aura-2-arcas-en'
  ],
  // English (Filipino) - en-ph
  'en-ph': [
    'aura-2-amalthea-en',
    'aura-2-thalia-en', 'aura-2-orion-en', 'aura-2-arcas-en'
  ],
  // Spanish variants
  'es': [
    'aura-2-celeste-es', 'aura-2-estrella-es', 'aura-2-nestor-es',
    'aura-2-sirio-es', 'aura-2-carina-es', 'aura-2-alvaro-es',
    'aura-2-diana-es', 'aura-2-aquila-es', 'aura-2-selena-es',
    'aura-2-javier-es', 'aura-2-agustina-es', 'aura-2-antonia-es',
    'aura-2-gloria-es', 'aura-2-luciano-es', 'aura-2-olivia-es',
    'aura-2-silvia-es', 'aura-2-valerio-es'
  ],
  'es-mx': [
    'aura-2-estrella-es', 'aura-2-sirio-es', 'aura-2-javier-es',
    'aura-2-luciano-es', 'aura-2-olivia-es', 'aura-2-valerio-es'
  ],
  'es-es': [
    'aura-2-nestor-es', 'aura-2-carina-es', 'aura-2-alvaro-es',
    'aura-2-diana-es', 'aura-2-agustina-es', 'aura-2-silvia-es'
  ],
  'es-co': [
    'aura-2-celeste-es', 'aura-2-gloria-es'
  ],
  'es-419': [
    'aura-2-aquila-es', 'aura-2-selena-es', 'aura-2-antonia-es'
  ],
  // German - de
  'de': [
    'aura-2-julius-de', 'aura-2-viktoria-de', 'aura-2-elara-de',
    'aura-2-aurelia-de', 'aura-2-lara-de', 'aura-2-fabian-de', 'aura-2-kara-de'
  ],
  // French - fr
  'fr': [
    'aura-2-agathe-fr', 'aura-2-hector-fr'
  ],
  // Italian - it
  'it': [
    'aura-2-livia-it', 'aura-2-dionisio-it', 'aura-2-melia-it',
    'aura-2-elio-it', 'aura-2-flavio-it', 'aura-2-maia-it',
    'aura-2-cinzia-it', 'aura-2-cesare-it', 'aura-2-perseo-it', 'aura-2-demetra-it'
  ],
  // Japanese - ja
  'ja': [
    'aura-2-fujin-ja', 'aura-2-izanami-ja', 'aura-2-uzume-ja',
    'aura-2-ebisu-ja', 'aura-2-ama-ja'
  ],
  // Dutch - nl
  'nl': [
    'aura-2-rhea-nl', 'aura-2-sander-nl', 'aura-2-beatrix-nl',
    'aura-2-daphne-nl', 'aura-2-cornelia-nl', 'aura-2-hestia-nl',
    'aura-2-lars-nl', 'aura-2-roman-nl', 'aura-2-leda-nl'
  ]
};

/**
 * Default TTS voice by language
 * Using Deepgram's featured voices as defaults
 * Reference: https://developers.deepgram.com/docs/tts-models
 */
export const DEFAULT_VOICE_BY_LANGUAGE: Record<TTSLanguage, string> = {
  // English variants
  'en-us': 'aura-2-thalia-en',
  'en-gb': 'aura-2-draco-en',
  'en-au': 'aura-2-hyperion-en',
  'en-ie': 'aura-2-thalia-en',
  'en-ph': 'aura-2-amalthea-en',
  // Spanish variants
  'es': 'aura-2-celeste-es',
  'es-mx': 'aura-2-estrella-es',
  'es-es': 'aura-2-nestor-es',
  'es-co': 'aura-2-celeste-es',
  'es-419': 'aura-2-aquila-es',
  // Other supported languages
  'de': 'aura-2-viktoria-de',
  'fr': 'aura-2-agathe-fr',
  'it': 'aura-2-livia-it',
  'ja': 'aura-2-izanami-ja',
  'nl': 'aura-2-rhea-nl'
};

/** Default application settings */
export const DEFAULT_SETTINGS = {
  TTS_LANGUAGE: 'de' as TTSLanguage,
  TTS_VOICE: 'aura-2-viktoria-de', // Default Deepgram Aura-2 voice for German
  STT_LANGUAGE: 'german' as STTLanguage, // Matched to TTS language
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
