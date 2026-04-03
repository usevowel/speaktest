/**
 * Language selection component for Talker
 */

import React, { useState } from 'react';
import { Languages, ArrowRight, Info, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useTalkerStore } from '@/stores/talkerStore';
import { TTS_LANGUAGE_MAPPINGS, SOURCE_LANGUAGES, TTS_TO_TRANSLATION_LANGUAGE, ASSEMBLYAI_STT_STREAMING_LANGUAGES } from '@/constants';
import type { TTSLanguage } from '@/shared/types';

export function LanguageSelector() {
  const {
    sourceLanguage,
    targetLanguage,
    setSourceLanguage,
    setTargetLanguage,
  } = useTalkerStore();

  const [isCollapsed, setIsCollapsed] = useState(true);

  // Check if translation is needed
  const targetLangName = TTS_TO_TRANSLATION_LANGUAGE[targetLanguage];
  const translationNeeded = sourceLanguage !== targetLangName;

  /** Set of languages supported by AssemblyAI STT Streaming for quick lookup */
  const ASSEMBLYAI_SUPPORTED_SET = new Set(ASSEMBLYAI_STT_STREAMING_LANGUAGES);
  
  /**
   * Check if a language is supported (excludes French as it doesn't work well with our service)
   * @param lang - The language to check
   * @returns true if the language is supported, false otherwise
   */
  const isLanguageSupported = (lang: string): boolean => {
    // French is disabled as it doesn't work well with our service
    if (lang === 'french' || lang === 'fr') {
      return false;
    }
    return ASSEMBLYAI_SUPPORTED_SET.has(lang as typeof ASSEMBLYAI_STT_STREAMING_LANGUAGES[number]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-lg font-semibold hover:text-primary transition-colors"
          >
            <Languages className="h-5 w-5" />
            Language Settings
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                {translationNeeded && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Translation enabled:</strong> Text will be automatically translated from{' '}
                      <span className="capitalize">{sourceLanguage}</span> to{' '}
                      {TTS_LANGUAGE_MAPPINGS[targetLanguage]?.name} before speech synthesis.
                    </p>
                  </div>
                )}

                {!translationNeeded && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      No translation needed - text will be spoken directly in{' '}
                      {TTS_LANGUAGE_MAPPINGS[targetLanguage]?.name}.
                    </p>
                  </div>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        {isCollapsed && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize">{sourceLanguage}</span>
            <span>{TTS_LANGUAGE_MAPPINGS[targetLanguage]?.name}</span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Language:</label>
            <Select
              value={sourceLanguage}
              onValueChange={setSourceLanguage}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source language..." />
              </SelectTrigger>
              <SelectContent>
                {[...SOURCE_LANGUAGES].sort((a, b) => {
                  const aSupported = isLanguageSupported(a);
                  const bSupported = isLanguageSupported(b);
                  // Supported languages first
                  if (aSupported && !bSupported) return -1;
                  if (!aSupported && bSupported) return 1;
                  // Then sort alphabetically within each group
                  return a.localeCompare(b);
                }).map((lang) => {
                  const isSupported = isLanguageSupported(lang);
                  return (
                    <SelectItem 
                      key={lang} 
                      value={lang}
                      disabled={!isSupported}
                    >
                      <span className={`capitalize ${!isSupported ? 'opacity-50' : ''}`}>
                        {lang}{!isSupported && ' *'}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Language of the text you type
            </p>
          </div>

        

          {/* Target Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Language (TTS):</label>
            <Select
              value={targetLanguage}
              onValueChange={(value: TTSLanguage) => setTargetLanguage(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target language..." />
              </SelectTrigger>
              <SelectContent>
                {[...Object.entries(TTS_LANGUAGE_MAPPINGS)].sort(([codeA], [codeB]) => {
                  const sttLanguageA = TTS_TO_TRANSLATION_LANGUAGE[codeA as TTSLanguage];
                  const sttLanguageB = TTS_TO_TRANSLATION_LANGUAGE[codeB as TTSLanguage];
                  const aSupported = isLanguageSupported(sttLanguageA);
                  const bSupported = isLanguageSupported(sttLanguageB);
                  // Supported languages first
                  if (aSupported && !bSupported) return -1;
                  if (!aSupported && bSupported) return 1;
                  // Then sort alphabetically by name within each group
                  const mappingA = TTS_LANGUAGE_MAPPINGS[codeA as TTSLanguage];
                  const mappingB = TTS_LANGUAGE_MAPPINGS[codeB as TTSLanguage];
                  return mappingA.name.localeCompare(mappingB.name);
                }).map(([code, mapping]) => {
                  const sttLanguage = TTS_TO_TRANSLATION_LANGUAGE[code as TTSLanguage];
                  const isSupported = isLanguageSupported(sttLanguage);
                  return (
                    <SelectItem 
                      key={code} 
                      value={code}
                      disabled={!isSupported}
                    >
                      <div className={`flex items-center gap-2 ${!isSupported ? 'opacity-50' : ''}`}>
                        <span>{mapping.name}{!isSupported && ' *'}</span>
                        {mapping.nativeName && mapping.nativeName !== mapping.name && (
                          <span className="text-xs text-muted-foreground">
                            ({mapping.nativeName})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Language for text-to-speech output
            </p>
          </div>
        </div>
      )}

      {/* Language availability note */}
      <p className="text-xs text-muted-foreground italic">
        * Languages marked with an asterisk are coming soon.
      </p>
    </div>
  );
}
