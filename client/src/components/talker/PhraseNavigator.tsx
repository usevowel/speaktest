/**
 * Phrase navigation and display component for Talker
 */

import React, { useEffect, useCallback } from 'react';
import { MdOutlineChat } from 'react-icons/md';
import {
  ChevronUp,
  ChevronDown,
  Play,
  Square,
  SkipBack,
  SkipForward,
  Hash,
  Type,
  MessageSquare,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { useTalkerStore } from '@/stores/talkerStore';
import { useTalkerActions } from '@/hooks/useTalkerActions';
import { TTS_VOICES, DEFAULT_VOICE_BY_LANGUAGE } from '@/constants';
import { ttsApi } from '@/lib/api';
import { keyboard } from '@/lib/utils';
import { parseVoiceName, filterVoicesByLanguage, getVoiceDisplayLabel, extractVoiceLanguage } from '@/lib/voice-utils';

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

export function PhraseNavigator() {
  const {
    selectedFile,
    selectedPhrase,
    currentPhraseIndex,
    phraseFilterMode,
    targetLanguage,
    voice,
    speed,
    isPlaying,
    isTranslating,
    isLoadingAudio,
    selectPhraseByIndex,
    setPhraseFilterMode,
    setVoice,
    setSpeed,
    nextPhrase,
    previousPhrase,
  } = useTalkerStore();

  const { playPhrase, stopPlayback } = useTalkerActions();

  // State for available voices fetched from API (filtered by language)
  const [allVoices, setAllVoices] = React.useState<string[]>([]);
  const [availableVoices, setAvailableVoices] = React.useState<string[]>([]);
  const [voicesLoading, setVoicesLoading] = React.useState(false);

  /**
   * Fetch available voices from Deepgram TTS API when target language changes
   */
  React.useEffect(() => {
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
          if (voiceLangCode !== targetLangCode) {
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

  // Filter phrases based on the selected mode
  const filteredPhrases = selectedFile ? selectedFile.phrases.filter(phrase => {
    switch (phraseFilterMode) {
      case 'no_prefix':
        return !phrase.prefix; // Only phrases with no prefix
      case 'response':
        return phrase.prefix === '**Response:**'; // Only response phrases
      case 'all':
      default:
        return true; // All phrases
    }
  }) : [];

  // Find current position in filtered phrases
  const currentFilteredIndex = selectedFile ? filteredPhrases.findIndex(p =>
    selectedFile.phrases.findIndex(op => op.id === p.id) === currentPhraseIndex
  ) : -1;

  const canGoUp = currentFilteredIndex > 0;
  const canGoDown = currentFilteredIndex < filteredPhrases.length - 1;

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!selectedFile || selectedFile.phrases.length === 0) return;

    // Prevent default behavior for our shortcuts
    if (keyboard.matchesShortcut(event, 'ArrowUp') ||
        keyboard.matchesShortcut(event, 'ArrowDown') ||
        keyboard.matchesShortcut(event, 'Space')) {
      event.preventDefault();
    }

    if (keyboard.matchesShortcut(event, 'ArrowUp')) {
      previousPhrase();
    } else if (keyboard.matchesShortcut(event, 'ArrowDown')) {
      nextPhrase();
    } else if (keyboard.matchesShortcut(event, 'Space')) {
      if (isPlaying) {
        stopPlayback();
      } else if (selectedPhrase) {
        playPhrase(selectedPhrase.text);
      }
    }
  }, [selectedPhrase, isPlaying, nextPhrase, previousPhrase, playPhrase, stopPlayback]);

  // Set up keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!selectedFile || selectedFile.phrases.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MdOutlineChat className="h-5 w-5" />
          Phrase Navigation
        </h3>
        <div className="p-8 bg-muted/50 rounded-md text-center text-muted-foreground">
          <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No phrases available</p>
          <p className="text-sm">Select a markdown file to see phrases</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MdOutlineChat className="h-5 w-5" />
          Phrase Navigation
        </h3>
        <div className="text-sm text-muted-foreground">
          {(() => {
            const currentFilteredIndex = filteredPhrases.findIndex(p =>
              selectedFile.phrases.findIndex(op => op.id === p.id) === currentPhraseIndex
            );
            return currentFilteredIndex >= 0
              ? `${currentFilteredIndex + 1} of ${filteredPhrases.length}`
              : '0 of 0';
          })()}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (canGoUp && currentFilteredIndex > 0) {
              const prevFilteredPhrase = filteredPhrases[currentFilteredIndex - 1];
              const prevOriginalIndex = selectedFile.phrases.findIndex(p => p.id === prevFilteredPhrase.id);
              selectPhraseByIndex(prevOriginalIndex);
            }
          }}
          disabled={!canGoUp}
          title="Previous filtered phrase (↑)"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (filteredPhrases.length > 0) {
              const firstFilteredPhrase = filteredPhrases[0];
              const firstOriginalIndex = selectedFile.phrases.findIndex(p => p.id === firstFilteredPhrase.id);
              selectPhraseByIndex(firstOriginalIndex);
            }
          }}
          disabled={currentFilteredIndex === 0}
          title="First filtered phrase"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant={isPlaying ? "destructive" : "default"}
          size="lg"
          onClick={() => {
            if (isPlaying) {
              stopPlayback();
            } else if (selectedPhrase) {
              playPhrase(selectedPhrase.text);
            }
          }}
          disabled={!selectedPhrase || isTranslating || isLoadingAudio}
          title={isPlaying ? "Stop (Space)" : "Play (Space)"}
        >
          {isTranslating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              Translating...
            </div>
          ) : isLoadingAudio ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              Loading...
            </div>
          ) : isPlaying ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Play
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (filteredPhrases.length > 0) {
              const lastFilteredPhrase = filteredPhrases[filteredPhrases.length - 1];
              const lastOriginalIndex = selectedFile.phrases.findIndex(p => p.id === lastFilteredPhrase.id);
              selectPhraseByIndex(lastOriginalIndex);
            }
          }}
          disabled={currentFilteredIndex === filteredPhrases.length - 1}
          title="Last filtered phrase"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={nextPhrase}
          disabled={!canGoDown}
          title="Next filtered phrase (↓)"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Voice & Filter Controls */}
      <div className="flex items-center justify-between flex-shrink-0">
        {/* Voice Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Voice:</label>
          <Select
            value={voice}
            onValueChange={(newVoice) => {
              console.log('Voice changed from', voice, 'to', newVoice);
              setVoice(newVoice);
            }}
            disabled={voicesLoading}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder={voicesLoading ? "Loading..." : "Select voice..."}>
                {voice ? parseVoiceName(voice) : "Select voice..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableVoices.map((voiceOption) => (
                <SelectItem key={voiceOption} value={voiceOption}>
                  {getVoiceDisplayLabel(voiceOption)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Speed:</label>
          <Select
            value={speed.toString()}
            onValueChange={(newSpeed) => setSpeed(parseFloat(newSpeed))}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="1.0" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 15 }, (_, i) => 0.5 + i * 0.25).map((speedOption) => (
                <SelectItem key={speedOption} value={speedOption.toString()}>
                  {speedOption.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Toggle Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={phraseFilterMode === 'no_prefix' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPhraseFilterMode('no_prefix')}
            title="Show only phrases with no prefix"
            className="text-xs"
          >
            <FileText className="h-3 w-3 mr-1" />
            No Prefix
          </Button>

          <Button
            variant={phraseFilterMode === 'response' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPhraseFilterMode('response')}
            title="Show only phrases with **Response:** prefix"
            className="text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Response
          </Button>
        </div>
      </div>

      {/* Phrase List - Takes up all remaining space */}
      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
        <div className="h-full overflow-y-auto">
          {filteredPhrases.map((phrase) => {
          // Find the original index of this phrase in the full phrases array
          const originalIndex = selectedFile.phrases.findIndex(p => p.id === phrase.id);
          const isSelected = originalIndex === currentPhraseIndex;

          return (
            <div
              key={phrase.id}
              className={`p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-primary/10 border-primary/20'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => selectPhraseByIndex(originalIndex)}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-8 text-xs text-muted-foreground text-center">
                  {originalIndex + 1}
                </div>
                <div className="flex-shrink-0">
                  {phrase.isHeading ? (
                    <Hash className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Type className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${
                    phrase.isHeading ? 'font-semibold' : ''
                  }`}>
                    {phrase.text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Line {phrase.lineNumber}
                    {phrase.prefix && (
                      <span className="ml-2 text-blue-600 font-medium">
                        {phrase.prefix}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-muted-foreground space-y-1 flex-shrink-0">
        <p><strong>Keyboard shortcuts:</strong></p>
        <p>↑/↓ Navigate phrases • Space Play/Stop</p>
      </div>
    </div>
  );
}
