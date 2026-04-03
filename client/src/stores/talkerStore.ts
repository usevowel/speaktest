/**
 * Zustand store for Talker feature state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarkdownFile, Phrase, TTSLanguage, Project } from '@/shared/types';
import { DEFAULT_SETTINGS, DEFAULT_VOICE_BY_LANGUAGE, TTS_VOICES } from '@/constants';
import { ttsApi } from '@/lib/api';
import { isValidVoice } from '@/lib/voices-cache';

interface TalkerState {
  // Projects
  projects: Project[];
  selectedProject: Project | null;
  projectFiles: MarkdownFile[];

  // Current file and phrase
  selectedFile: MarkdownFile | null;
  selectedPhrase: Phrase | null;
  currentPhraseIndex: number;

  // Phrase filtering
  phraseFilterMode: 'all' | 'no_prefix' | 'response';

  // Language and voice settings
  sourceLanguage: string;
  targetLanguage: TTSLanguage;
  voice: string;
  speed: number;

  // Playback state
  isPlaying: boolean;
  isTranslating: boolean;
  isLoadingAudio: boolean;
  currentAudio: HTMLAudioElement | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  setProjectFiles: (files: MarkdownFile[]) => void;
  setSelectedFile: (file: MarkdownFile | null) => void;
  setSelectedPhrase: (phrase: Phrase | null, index?: number) => void;
  setCurrentPhraseIndex: (index: number) => void;
  setPhraseFilterMode: (mode: 'all' | 'no_prefix' | 'response') => void;
  setSourceLanguage: (language: string) => void;
  setTargetLanguage: (language: TTSLanguage) => void;
  setVoice: (voice: string) => void;
  setSpeed: (speed: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsTranslating: (translating: boolean) => void;
  setIsLoadingAudio: (loading: boolean) => void;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
  
  // Navigation actions
  nextPhrase: () => void;
  previousPhrase: () => void;
  selectPhraseByIndex: (index: number) => void;
  
  // Reset actions
  reset: () => void;
  resetPlayback: () => void;
}

export const useTalkerStore = create<TalkerState>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      selectedProject: null,
      projectFiles: [],
      selectedFile: null,
      selectedPhrase: null,
      currentPhraseIndex: 0,
      phraseFilterMode: 'response' as const,
      sourceLanguage: DEFAULT_SETTINGS.SOURCE_LANGUAGE,
      targetLanguage: DEFAULT_SETTINGS.TTS_LANGUAGE,
      voice: DEFAULT_SETTINGS.TTS_VOICE,
      speed: 1.0,
      isPlaying: false,
      isTranslating: false,
      isLoadingAudio: false,
      currentAudio: null,

      // Basic setters
      setProjects: (projects) => set({ projects }),
      setSelectedProject: (project) => set({ selectedProject: project }),
      setProjectFiles: (files) => set({ projectFiles: files }),
      setSelectedFile: (file) => {
        if (!file) {
          set({
            selectedFile: null,
            selectedPhrase: null,
            currentPhraseIndex: 0,
          });
          return;
        }

        // Find the first phrase that matches the current filter mode
        const { phraseFilterMode } = get();
        const firstMatchingPhrase = file.phrases.find(phrase => {
          switch (phraseFilterMode) {
            case 'no_prefix':
              return !phrase.prefix;
            case 'response':
              return phrase.prefix === '**Response:**';
            case 'all':
            default:
              return true;
          }
        });

        const firstMatchingIndex = firstMatchingPhrase
          ? file.phrases.indexOf(firstMatchingPhrase)
          : 0;

        // Don't override voice when selecting a file - keep the current voice
        // Voice should only change when language changes, not when file changes
        set({
          selectedFile: file,
          selectedPhrase: firstMatchingPhrase || file.phrases[0] || null,
          currentPhraseIndex: firstMatchingIndex,
          // Keep existing voice - don't override
        });
      },

      setSelectedPhrase: (phrase, index) => {
        set({
          selectedPhrase: phrase,
          currentPhraseIndex: index ?? get().currentPhraseIndex,
        });
      },

      setCurrentPhraseIndex: (index) => {
        const { selectedFile } = get();
        if (selectedFile && selectedFile.phrases[index]) {
          set({
            currentPhraseIndex: index,
            selectedPhrase: selectedFile.phrases[index],
          });
        }
      },

      setPhraseFilterMode: (mode) => set({ phraseFilterMode: mode }),
      setSourceLanguage: (language) => set({ sourceLanguage: language }),
      setTargetLanguage: (language) => {
        const newLanguage = language;
        
        // Set language immediately
        set({ targetLanguage: newLanguage });
        
        // Fetch available voices from API and pick the first one asynchronously
        // This doesn't block the state update
        (async () => {
          try {
            const response = await ttsApi.getVoices(newLanguage);
            if (response.success && response.data && response.data.length > 0) {
              // Use the first available voice from the API
              const firstVoice = response.data[0];
              console.log(`🎵 Language changed to ${newLanguage}, setting voice to first available: ${firstVoice} (validated from API)`);
              get().setVoice(firstVoice);
            } else {
              // Fallback to constants if API fails
              const fallbackVoices = TTS_VOICES[newLanguage] || [];
              const fallbackVoice = fallbackVoices.length > 0 ? fallbackVoices[0] : DEFAULT_VOICE_BY_LANGUAGE[newLanguage];
              console.log(`🎵 Language changed to ${newLanguage}, using fallback voice: ${fallbackVoice} (API unavailable)`);
              get().setVoice(fallbackVoice);
            }
          } catch (error) {
            console.error('Failed to fetch voices for language:', error);
            // Fallback to default voice for language
            const fallbackVoice = DEFAULT_VOICE_BY_LANGUAGE[newLanguage] || DEFAULT_SETTINGS.TTS_VOICE;
            console.log(`🎵 Language changed to ${newLanguage}, using fallback voice: ${fallbackVoice} (error fetching)`);
            get().setVoice(fallbackVoice);
          }
        })();
      },
      setVoice: (newVoice) => {
        const { targetLanguage, voice: currentVoice } = get();
        
        // Validate voice is valid for current language
        if (targetLanguage && newVoice) {
          if (!isValidVoice(targetLanguage, newVoice)) {
            console.warn(`⚠️ Voice "${newVoice}" may not be valid for language "${targetLanguage}", but setting anyway (will be validated on server)`);
          }
        }
        
        console.log('🎵 setVoice called:', { 
          newVoice, 
          currentVoice,
          targetLanguage,
          willChange: newVoice !== currentVoice ? '✅ YES' : '❌ NO CHANGE'
        });
        
        set({ voice: newVoice });
        
        // Verify the state was updated
        const updatedState = get();
        if (updatedState.voice !== newVoice) {
          console.error('❌ Voice state update failed!', {
            requested: newVoice,
            actual: updatedState.voice,
            match: '❌ MISMATCH'
          });
        } else {
          console.log('✅ Voice state updated successfully:', updatedState.voice);
        }
      },
      setSpeed: (speed) => set({ speed }),
      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setIsTranslating: (translating) => set({ isTranslating: translating }),
      setIsLoadingAudio: (loading) => set({ isLoadingAudio: loading }),
      setCurrentAudio: (audio) => set({ currentAudio: audio }),

      // Navigation actions
      nextPhrase: () => {
        const { selectedFile, currentPhraseIndex, phraseFilterMode } = get();
        if (!selectedFile) return;

        // Find next phrase that matches the current filter
        for (let i = currentPhraseIndex + 1; i < selectedFile.phrases.length; i++) {
          const phrase = selectedFile.phrases[i];
          const matchesFilter = (() => {
            switch (phraseFilterMode) {
              case 'no_prefix':
                return !phrase.prefix;
              case 'response':
                return phrase.prefix === '**Response:**';
              case 'all':
              default:
                return true;
            }
          })();

          if (matchesFilter) {
            set({
              currentPhraseIndex: i,
              selectedPhrase: phrase,
            });
            return;
          }
        }
      },

      previousPhrase: () => {
        const { selectedFile, currentPhraseIndex, phraseFilterMode } = get();
        if (!selectedFile) return;

        // Find previous phrase that matches the current filter
        for (let i = currentPhraseIndex - 1; i >= 0; i--) {
          const phrase = selectedFile.phrases[i];
          const matchesFilter = (() => {
            switch (phraseFilterMode) {
              case 'no_prefix':
                return !phrase.prefix;
              case 'response':
                return phrase.prefix === '**Response:**';
              case 'all':
              default:
                return true;
            }
          })();

          if (matchesFilter) {
            set({
              currentPhraseIndex: i,
              selectedPhrase: phrase,
            });
            return;
          }
        }
      },

      selectPhraseByIndex: (index) => {
        const { selectedFile } = get();
        if (selectedFile && selectedFile.phrases[index]) {
          set({
            currentPhraseIndex: index,
            selectedPhrase: selectedFile.phrases[index],
          });
        }
      },

      // Reset actions
      reset: () => {
        const { currentAudio } = get();
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        
        set({
          selectedFile: null,
          selectedPhrase: null,
          currentPhraseIndex: 0,
          isPlaying: false,
          isTranslating: false,
          isLoadingAudio: false,
          currentAudio: null,
        });
      },

      resetPlayback: () => {
        const { currentAudio } = get();
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        
        set({
          isPlaying: false,
          isLoadingAudio: false,
          currentAudio: null,
        });
      },
    }),
    {
      name: 'talker-store',
      partialize: (state) => ({
        sourceLanguage: state.sourceLanguage,
        targetLanguage: state.targetLanguage,
        voice: state.voice, // Ensure voice is persisted
        speed: state.speed,
        phraseFilterMode: state.phraseFilterMode,
        // Don't persist file data - start fresh each session
        selectedFile: null,
        selectedPhrase: null,
        currentPhraseIndex: 0,
      }),
    }
  )
);
