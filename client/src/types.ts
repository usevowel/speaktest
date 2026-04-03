/**
 * Local type definitions for client
 */

/** Supported TTS languages - based on Deepgram Aura TTS models
 * Reference: https://developers.deepgram.com/docs/tts-models
 */
export type TTSLanguage =
  // English variants
  | 'en-us' | 'en-gb' | 'en-au' | 'en-ie' | 'en-ph'
  // Spanish variants
  | 'es' | 'es-mx' | 'es-es' | 'es-co' | 'es-419'
  // Other supported languages
  | 'de' | 'fr' | 'it' | 'ja' | 'nl';

/** Supported STT languages - filtered to match TTS support
 * Only languages that have both STT and TTS support are included
 * Reference: https://developers.deepgram.com/docs/tts-models
 */
export type STTLanguage =
  | 'english' | 'spanish' | 'german' | 'french' | 'italian' | 'japanese' | 'dutch';

/** Language mappings for display */
export interface LanguageMapping {
  code: string;
  name: string;
  nativeName?: string;
}
