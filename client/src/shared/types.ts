/**
 * Shared type definitions for vowel.to tester application
 */

/** Supported TTS languages */
export type TTSLanguage = 'en-us' | 'en-gb' | 'ja' | 'zh' | 'es' | 'fr' | 'hi' | 'it' | 'pt-br' | 'de' | 'ko';

/** Supported STT languages */
export type STTLanguage = 
  | 'english' | 'chinese' | 'german' | 'spanish' | 'russian' | 'korean' | 'french' 
  | 'japanese' | 'portuguese' | 'turkish' | 'polish' | 'catalan' | 'dutch' | 'arabic' 
  | 'swedish' | 'italian' | 'indonesian' | 'hindi' | 'finnish' | 'vietnamese' | 'hebrew' 
  | 'ukrainian' | 'greek' | 'malay' | 'czech' | 'romanian' | 'danish' | 'hungarian' 
  | 'tamil' | 'norwegian' | 'thai' | 'urdu' | 'croatian' | 'bulgarian' | 'lithuanian' 
  | 'latin' | 'maori' | 'malayalam' | 'welsh' | 'slovak' | 'telugu' | 'persian' 
  | 'latvian' | 'bengali' | 'serbian' | 'azerbaijani' | 'slovenian' | 'kannada' 
  | 'estonian' | 'macedonian' | 'breton' | 'basque' | 'icelandic' | 'armenian' 
  | 'nepali' | 'mongolian' | 'bosnian' | 'kazakh' | 'albanian' | 'swahili' 
  | 'galician' | 'marathi' | 'punjabi' | 'sinhala' | 'khmer' | 'shona' | 'yoruba' 
  | 'somali' | 'afrikaans' | 'occitan' | 'georgian' | 'belarusian' | 'tajik' 
  | 'sindhi' | 'gujarati' | 'amharic' | 'yiddish' | 'lao' | 'uzbek' | 'faroese' 
  | 'haitian creole' | 'pashto' | 'turkmen' | 'nynorsk' | 'maltese' | 'sanskrit' 
  | 'luxembourgish' | 'myanmar' | 'tibetan' | 'tagalog' | 'malagasy' | 'assamese' 
  | 'tatar' | 'hawaiian' | 'lingala' | 'hausa' | 'bashkir' | 'javanese' | 'sundanese' 
  | 'cantonese' | 'burmese' | 'valencian' | 'flemish' | 'haitian' | 'letzeburgesch' 
  | 'pushto' | 'panjabi' | 'moldavian' | 'moldovan' | 'sinhalese' | 'castilian' | 'mandarin';

/** Project structure */
export interface Project {
  id: string;
  name: string;
  path: string;
  markdownFiles: MarkdownFile[];
}

/** Markdown file structure */
export interface MarkdownFile {
  id: string;
  name: string;
  path: string;
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
