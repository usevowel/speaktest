/**
 * Settings tab component containing Talker and Listener settings
 */

import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTalkerStore } from '@/stores/talkerStore';
import { useListenerStore } from '@/stores/listenerStore';
import { TTS_LANGUAGE_MAPPINGS, SOURCE_LANGUAGES, TTS_VOICES, DEFAULT_VOICE_BY_LANGUAGE, ASSEMBLYAI_STT_STREAMING_LANGUAGES, TTS_TO_TRANSLATION_LANGUAGE } from '@/constants';
import { ttsApi } from '@/lib/api';
import { parseVoiceName, filterVoicesByLanguage, getVoiceDisplayLabel, extractVoiceLanguage, isFishVoice } from '@/lib/voice-utils';
import type { TTSLanguage } from '@/shared/types';

/**
 * Maps TTS language codes to voice language codes for comparison
 */
function getLanguageCodeForVoiceFilter(language: string): string {
  const map: Record<string, string> = {
    'en-us': 'en', 'en-gb': 'en', 'en-au': 'en', 'en-ie': 'en', 'en-ph': 'en',
    'es': 'es', 'es-mx': 'es', 'es-es': 'es', 'es-co': 'es', 'es-419': 'es',
    'de': 'de', 'fr': 'fr', 'it': 'it', 'ja': 'ja', 'nl': 'nl',
  };
  return map[language.toLowerCase()] || language;
}

export function SettingsTab() {
  // Talker settings
  const {
    sourceLanguage,
    targetLanguage,
    voice,
    speed,
    setSourceLanguage,
    setTargetLanguage,
    setVoice,
    setSpeed,
  } = useTalkerStore();

  // Listener settings
  const {
    isListening,
  } = useListenerStore();

  // State for available voices fetched from API (filtered by language)
  const [allVoices, setAllVoices] = useState<string[]>([]);
  const [availableVoices, setAvailableVoices] = useState<string[]>(TTS_VOICES[targetLanguage] || []);
  const [voicesLoading, setVoicesLoading] = useState(false);

  /**
   * Fetch available voices from TTS API when target language changes
   */
  useEffect(() => {
    const fetchVoices = async () => {
      setVoicesLoading(true);
      try {
        const response = await ttsApi.getVoices(targetLanguage);
        if (response.success && response.data && response.data.length > 0) {
          // Store all voices from API
          setAllVoices(response.data);
          // Filter voices by the current target language
          const filteredVoices = filterVoicesByLanguage(response.data, targetLanguage);
          setAvailableVoices(filteredVoices);

          // If current voice is not valid for this language, switch to default
          const voiceLangCode = extractVoiceLanguage(voice);
          const targetLangCode = getLanguageCodeForVoiceFilter(targetLanguage);
          if (!isFishVoice(voice) && voiceLangCode !== targetLangCode) {
            const defaultVoice = DEFAULT_VOICE_BY_LANGUAGE[targetLanguage];
            if (defaultVoice && filteredVoices.includes(defaultVoice)) {
              setVoice(defaultVoice);
            } else if (filteredVoices.length > 0) {
              setVoice(filteredVoices[0]);
            }
          }
        } else {
          // Fallback to constants if API fails
          const fallbackVoices = TTS_VOICES[targetLanguage] || [];
          setAllVoices(fallbackVoices);
          setAvailableVoices(fallbackVoices);
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
        // Fallback to constants on error
        const fallbackVoices = TTS_VOICES[targetLanguage] || [];
        setAllVoices(fallbackVoices);
        setAvailableVoices(fallbackVoices);
      } finally {
        setVoicesLoading(false);
      }
    };

    fetchVoices();
  }, [targetLanguage, voice, setVoice]);

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
    <div className="p-2 space-y-2">
      {/* Language explanation note */}
      <p className="text-xs text-muted-foreground">
        Source language is the language returned to show what was spoken. Target language is what will be spoken.
      </p>
      
      {/* Talker Settings - Compact Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Row 1: Source and Target */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Src:</label>
          <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
            <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
              <SelectValue />
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
                    className="text-xs"
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
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Tgt:</label>
          <Select
            value={targetLanguage}
            onValueChange={(value: TTSLanguage) => setTargetLanguage(value)}
          >
            <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
              <SelectValue />
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
                    className="text-xs"
                    disabled={!isSupported}
                  >
                    <span className={!isSupported ? 'opacity-50' : ''}>
                      {mapping.name}{!isSupported && ' *'}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Row 2: Voice and Speed */}
        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Voice:</label>
          <Select value={voice} onValueChange={setVoice} disabled={voicesLoading}>
            <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
              <SelectValue placeholder={voicesLoading ? "Loading..." : "Select voice"}>
                {voice ? parseVoiceName(voice) : "Select voice"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableVoices.map((voiceOption) => (
                <SelectItem key={voiceOption} value={voiceOption} className="text-xs">
                  {getVoiceDisplayLabel(voiceOption)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Speed:</label>
          <Select value={speed.toString()} onValueChange={(value) => setSpeed(parseFloat(value))}>
            <SelectTrigger className="h-7 text-xs flex-1 min-w-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 15 }, (_, i) => 0.5 + i * 0.25).map((speedOption) => (
                <SelectItem key={speedOption} value={speedOption.toString()} className="text-xs">
                  {speedOption.toFixed(2)}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listener Settings - Compact Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Note: STT always listens in target language and translates to source language */}
      </div>

      {/* Language availability note */}
      <p className="text-xs text-muted-foreground italic">
        * Languages marked with an asterisk are coming soon.
      </p>
    </div>
  );
}
