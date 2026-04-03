/**
 * Shared type definitions for vowel.to tester application
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

/** Project structure */
export interface Project {
  id: string;
  name: string;
  path: string;
  markdownFiles: MarkdownFile[];
}

/** Markdown file metadata (without content) */
export interface MarkdownFileMeta {
  id: string;
  name: string;
  path: string;
}

/** Markdown file structure */
export interface MarkdownFile extends MarkdownFileMeta {
  content: string;
  phrases: Phrase[];
}

/** Individual phrase from markdown */
export interface Phrase {
  id: string;
  text: string;
  lineNumber: number;
  isHeading: boolean;
  level?: number; // heading level (1-6)
  prefix?: string; // prefix like "**Response:**" or empty string for no prefix
}

/** Transcription entry */
export interface Transcription {
  id: string;
  text: string;
  language: STTLanguage;
  timestamp: Date;
  confidence?: number;
  duration?: number;
}

/** Translation request/response */
export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string; // Language name (e.g., 'japanese', 'english')
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string; // Language name (e.g., 'japanese', 'english')
}

/** TTS request/response */
export interface TTSRequest {
  text: string;
  language: TTSLanguage;
  voice?: string;
  speed?: number;
}

export interface TTSResponse {
  audioUrl: string;
  duration?: number;
}

/** STT request/response */
export interface STTRequest {
  audioData: Blob;
  language: STTLanguage;
}

export interface STTResponse {
  text: string;
  confidence: number;
  language: STTLanguage;
}

/** API Response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Application state interfaces */
export interface TalkerState {
  selectedProject?: Project;
  selectedFile?: MarkdownFile;
  selectedPhrase?: Phrase;
  currentPhraseIndex: number;
  sourceLanguage: string;
  targetLanguage: TTSLanguage;
  isPlaying: boolean;
  isTranslating: boolean;
}

export interface ListenerState {
  isListening: boolean;
  targetLanguage: STTLanguage;
  transcriptions: Transcription[];
  currentTranscription?: string;
  vadSensitivity: number;
}

/** Filter and sort options for transcriptions */
export interface TranscriptionFilters {
  language?: STTLanguage;
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
}

export interface TranscriptionSort {
  field: 'timestamp' | 'language' | 'text';
  direction: 'asc' | 'desc';
}

/** Language mappings */
export interface LanguageMapping {
  code: string;
  name: string;
  nativeName?: string;
}

/** Audio processing interfaces */
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface VADConfig {
  sensitivity: number;
  minSilenceDuration: number;
  maxRecordingDuration: number;
}
