/**
 * Constants for vowel.to tester client
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
 * These are fallback voices used when API is unavailable
 * Actual voices are fetched dynamically from Deepgram TTS API
 * Reference: https://developers.deepgram.com/docs/tts-models
 *
 * Aura-2 voices follow format: aura-2-{voicename}-{language}
 * Language codes: en (English variants), es (Spanish variants), de, fr, it, ja, nl
 */
export const TTS_VOICES: Record<TTSLanguage, string[]> = {
  // English (US) - en-us - American accent voices
  'en-us': [
    // Featured voices
    'aura-2-thalia-en',     // Female - Clear, Confident, Energetic, Enthusiastic
    'aura-2-andromeda-en',    // Female - Casual, Expressive, Comfortable
    'aura-2-helena-en',       // Female - Caring, Natural, Positive, Friendly, Raspy
    'aura-2-apollo-en',       // Male - Confident, Comfortable, Casual
    'aura-2-arcas-en',        // Male - Natural, Smooth, Clear, Comfortable
    'aura-2-aries-en',        // Male - Warm, Energetic, Caring
    // All en-us voices
    'aura-2-asteria-en',      // Female - Clear, Confident, Knowledgeable, Energetic
    'aura-2-athena-en',       // Female - Calm, Smooth, Professional
    'aura-2-atlas-en',        // Male - Enthusiastic, Confident, Approachable
    'aura-2-aurora-en',       // Female - Cheerful, Expressive, Energetic
    'aura-2-callista-en',     // Female - Clear, Energetic, Professional, Smooth
    'aura-2-cora-en',         // Female - Smooth, Melodic, Caring
    'aura-2-cordelia-en',     // Female - Approachable, Warm, Polite
    'aura-2-delia-en',        // Female - Casual, Friendly, Cheerful, Breathy
    'aura-2-electra-en',      // Female - Professional, Engaging, Knowledgeable
    'aura-2-harmonia-en',     // Female - Empathetic, Clear, Calm, Confident
    'aura-2-hera-en',         // Female - Smooth, Warm, Professional
    'aura-2-hermes-en',       // Male - Expressive, Engaging, Professional
    'aura-2-iris-en',         // Female - Cheerful, Positive, Approachable
    'aura-2-janus-en',        // Female - Southern, Smooth, Trustworthy
    'aura-2-juno-en',         // Female - Natural, Engaging, Melodic, Breathy
    'aura-2-jupiter-en',      // Male - Expressive, Knowledgeable, Baritone
    'aura-2-luna-en',         // Female - Friendly, Natural, Engaging
    'aura-2-mars-en',         // Male - Smooth, Patient, Trustworthy, Baritone
    'aura-2-minerva-en',      // Female - Positive, Friendly, Natural
    'aura-2-neptune-en',      // Male - Professional, Patient, Polite
    'aura-2-odysseus-en',     // Male - Calm, Smooth, Comfortable, Professional
    'aura-2-ophelia-en',      // Female - Expressive, Enthusiastic, Cheerful
    'aura-2-orion-en',        // Male - Approachable, Comfortable, Calm, Polite
    'aura-2-orpheus-en',      // Male - Professional, Clear, Confident, Trustworthy
    'aura-2-phoebe-en',       // Female - Energetic, Warm, Casual
    'aura-2-pluto-en',        // Male - Smooth, Calm, Empathetic, Baritone
    'aura-2-saturn-en',       // Male - Knowledgeable, Confident, Baritone
    'aura-2-selene-en',       // Female - Expressive, Engaging, Energetic
    'aura-2-zeus-en',         // Male - Deep, Trustworthy, Smooth
    // Legacy Aura-1 voices
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
    'aura-zeus-en'
  ],
  // English (UK) - en-gb - British accent voices
  'en-gb': [
    'aura-2-draco-en',        // Male - Warm, Approachable, Trustworthy, Baritone (British)
    'aura-2-pandora-en',      // Female - Smooth, Calm, Melodic, Breathy (British)
    'aura-2-helios-en',       // Male - Professional, Clear, Confident
    'aura-2-athena-en',       // Female - Calm, Smooth, Professional
    // Fallback to general English voices
    'aura-2-thalia-en',
    'aura-2-orion-en',
    'aura-2-arcas-en'
  ],
  // English (Australian) - en-au
  'en-au': [
    'aura-2-hyperion-en',     // Male - Caring, Warm, Empathetic (Australian)
    'aura-2-theia-en',        // Female - Expressive, Polite, Sincere (Australian)
    // Fallback to general English voices
    'aura-2-thalia-en',
    'aura-2-orion-en',
    'aura-2-arcas-en'
  ],
  // English (Irish) - en-ie
  'en-ie': [
    // Note: Deepgram doesn't have specific Irish voices yet, use general English
    'aura-2-thalia-en',
    'aura-2-orion-en',
    'aura-2-arcas-en',
    'aura-angus-en'           // Legacy Irish male voice
  ],
  // English (Filipino) - en-ph
  'en-ph': [
    'aura-2-amalthea-en',     // Female - Engaging, Natural, Cheerful (Filipino)
    // Fallback to general English voices
    'aura-2-thalia-en',
    'aura-2-orion-en',
    'aura-2-arcas-en'
  ],
  // Spanish (General) - es
  'es': [
    // Featured Spanish voices
    'aura-2-celeste-es',      // Female - Clear, Energetic, Positive, Friendly (Colombian)
    'aura-2-estrella-es',     // Female - Approachable, Natural, Calm, Comfortable (Mexican)
    'aura-2-nestor-es',       // Male - Calm, Professional, Approachable, Clear (Peninsular)
    // All Spanish voices
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
    'aura-2-valerio-es'       // Male - Deep, Knowledgeable, Natural, Polite (Mexican)
  ],
  // Spanish (Mexican) - es-mx
  'es-mx': [
    'aura-2-estrella-es',     // Female - Approachable, Natural, Calm, Comfortable
    'aura-2-sirio-es',        // Male - Calm, Professional, Comfortable, Empathetic
    'aura-2-javier-es',       // Male - Approachable, Professional, Friendly, Comfortable
    'aura-2-luciano-es',      // Male - Charismatic, Cheerful, Energetic, Expressive
    'aura-2-olivia-es',       // Female - Breathy, Calm, Casual, Expressive
    'aura-2-valerio-es'       // Male - Deep, Knowledgeable, Natural, Polite
  ],
  // Spanish (Peninsular/Spain) - es-es
  'es-es': [
    'aura-2-nestor-es',       // Male - Calm, Professional, Approachable, Clear
    'aura-2-carina-es',       // Female - Professional, Raspy, Energetic, Breathy
    'aura-2-alvaro-es',       // Male - Calm, Professional, Clear, Knowledgeable
    'aura-2-diana-es',        // Female - Professional, Confident, Expressive, Polite
    'aura-2-agustina-es',     // Female - Calm, Clear, Expressive, Knowledgeable
    'aura-2-silvia-es'        // Female - Charismatic, Clear, Expressive, Natural
  ],
  // Spanish (Colombian) - es-co
  'es-co': [
    'aura-2-celeste-es',      // Female - Clear, Energetic, Positive, Friendly
    'aura-2-gloria-es'        // Female - Casual, Clear, Expressive, Natural
  ],
  // Spanish (Latin American) - es-419
  'es-419': [
    'aura-2-aquila-es',       // Male - Expressive, Enthusiastic, Confident, Casual
    'aura-2-selena-es',       // Female - Approachable, Casual, Friendly, Calm
    'aura-2-antonia-es'       // Female - Approachable, Enthusiastic, Friendly, Natural (Argentine)
  ],
  // German - de
  'de': [
    // Featured German voices
    'aura-2-julius-de',       // Male - Casual, Cheerful, Engaging, Expressive
    'aura-2-viktoria-de',     // Female - Charismatic, Cheerful, Enthusiastic, Friendly
    // All German voices
    'aura-2-elara-de',        // Female - Calm, Clear, Natural, Patient
    'aura-2-aurelia-de',      // Female - Approachable, Casual, Comfortable, Natural
    'aura-2-lara-de',         // Female - Caring, Cheerful, Empathetic, Expressive
    'aura-2-fabian-de',       // Male - Confident, Knowledgeable, Natural, Polite
    'aura-2-kara-de'          // Female - Caring, Empathetic, Expressive, Professional
  ],
  // French - fr
  'fr': [
    'aura-2-agathe-fr',       // Female - Charismatic, Cheerful, Enthusiastic, Friendly
    'aura-2-hector-fr'        // Male - Confident, Empathetic, Expressive, Friendly
  ],
  // Italian - it
  'it': [
    // Featured Italian voices
    'aura-2-livia-it',        // Female - Approachable, Cheerful, Clear, Engaging
    'aura-2-dionisio-it',     // Male - Confident, Engaging, Friendly, Melodic
    // All Italian voices
    'aura-2-melia-it',        // Female - Clear, Comfortable, Engaging, Friendly
    'aura-2-elio-it',         // Male - Breathy, Calm, Professional, Smooth
    'aura-2-flavio-it',       // Male - Confident, Deep, Empathetic, Professional
    'aura-2-maia-it',         // Female - Caring, Energetic, Expressive, Professional
    'aura-2-cinzia-it',       // Female - Approachable, Friendly, Smooth, Trustworthy
    'aura-2-cesare-it',       // Male - Clear, Empathetic, Knowledgeable, Natural
    'aura-2-perseo-it',       // Male - Casual, Clear, Natural, Polite
    'aura-2-demetra-it'       // Female - Calm, Comfortable, Patient
  ],
  // Japanese - ja
  'ja': [
    // Featured Japanese voices
    'aura-2-fujin-ja',        // Male - Calm, Confident, Knowledgeable, Professional
    'aura-2-izanami-ja',      // Female - Approachable, Clear, Knowledgeable, Polite
    // All Japanese voices
    'aura-2-uzume-ja',        // Female - Approachable, Clear, Polite, Professional
    'aura-2-ebisu-ja',        // Male - Calm, Deep, Natural, Patient
    'aura-2-ama-ja'           // Female - Casual, Comfortable, Confident, Knowledgeable
  ],
  // Dutch - nl
  'nl': [
    // Featured Dutch voices
    'aura-2-rhea-nl',         // Female - Caring, Knowledgeable, Positive, Smooth
    'aura-2-sander-nl',       // Male - Calm, Clear, Deep, Professional
    'aura-2-beatrix-nl',      // Female - Cheerful, Enthusiastic, Friendly, Trustworthy
    // All Dutch voices
    'aura-2-daphne-nl',       // Female - Calm, Clear, Confident, Professional
    'aura-2-cornelia-nl',     // Female - Approachable, Friendly, Polite, Positive
    'aura-2-hestia-nl',       // Female - Approachable, Caring, Expressive, Friendly
    'aura-2-lars-nl',         // Male - Breathy, Casual, Comfortable, Sincere
    'aura-2-roman-nl',        // Male - Calm, Casual, Deep, Natural
    'aura-2-leda-nl'          // Female - Caring, Comfortable, Empathetic, Friendly
  ]
};

/**
 * Default TTS voice by language
 * Based on Deepgram Aura TTS model recommendations
 * Reference: https://developers.deepgram.com/docs/tts-models
 *
 * Featured voices are used as defaults for best quality:
 * - English: aura-2-thalia-en (clear, confident, energetic)
 * - Spanish: aura-2-celeste-es (clear, energetic, positive)
 * - German: aura-2-viktoria-de (charismatic, cheerful, enthusiastic)
 * - French: aura-2-agathe-fr (charismatic, cheerful, enthusiastic)
 * - Italian: aura-2-livia-it (approachable, cheerful, clear)
 * - Japanese: aura-2-izanami-ja (approachable, clear, knowledgeable)
 * - Dutch: aura-2-rhea-nl (caring, knowledgeable, positive)
 */
export const DEFAULT_VOICE_BY_LANGUAGE: Record<TTSLanguage, string> = {
  // English variants
  'en-us': 'aura-2-thalia-en',     // Featured female voice - American
  'en-gb': 'aura-2-draco-en',       // British male voice - warm, approachable
  'en-au': 'aura-2-hyperion-en',    // Australian male voice - caring, warm
  'en-ie': 'aura-2-thalia-en',      // No specific Irish voice, use general English
  'en-ph': 'aura-2-amalthea-en',    // Filipino female voice - engaging, natural
  // Spanish variants
  'es': 'aura-2-celeste-es',        // Featured Colombian female voice
  'es-mx': 'aura-2-estrella-es',    // Featured Mexican female voice
  'es-es': 'aura-2-nestor-es',       // Featured Peninsular male voice
  'es-co': 'aura-2-celeste-es',     // Featured Colombian female voice
  'es-419': 'aura-2-aquila-es',     // Latin American male voice
  // Other supported languages
  'de': 'aura-2-viktoria-de',       // Featured German female voice
  'fr': 'aura-2-agathe-fr',         // Featured French female voice
  'it': 'aura-2-livia-it',          // Featured Italian female voice
  'ja': 'aura-2-izanami-ja',        // Featured Japanese female voice
  'nl': 'aura-2-rhea-nl'            // Featured Dutch female voice
};

/** Default application settings */
export const DEFAULT_SETTINGS = {
  TTS_LANGUAGE: 'de' as TTSLanguage,
  TTS_VOICE: 'aura-2-viktoria-de', // Default Deepgram Aura-2 voice for German (charismatic, cheerful)
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
