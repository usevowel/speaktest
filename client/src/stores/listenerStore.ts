/**
 * Zustand store for Listener feature state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transcription, TranscriptionFilters, TranscriptionSort } from '@/shared/types';
import { DEFAULT_SETTINGS } from '@/constants';

interface ListenerState {
  // Recording state
  isListening: boolean;
  isRecording: boolean;
  mediaStream: MediaStream | null;
  mediaRecorder: MediaRecorder | null;
  
  // VAD settings
  vadSensitivity: number;
  
  // Transcriptions
  transcriptions: Transcription[];
  currentTranscription: string;
  
  // Filters and sorting
  filters: TranscriptionFilters;
  sort: TranscriptionSort;
  
  // UI state
  isProcessing: boolean;
  error: string | null;
  isUserSpeaking: boolean;
  isWaitingForSTT: boolean;
  
  // Actions
  setIsListening: (listening: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  setMediaStream: (stream: MediaStream | null) => void;
  setMediaRecorder: (recorder: MediaRecorder | null) => void;
  setVadSensitivity: (sensitivity: number) => void;
  setTranscriptions: (transcriptions: Transcription[]) => void;
  addTranscription: (transcription: Transcription) => void;
  removeTranscription: (id: string) => void;
  clearTranscriptions: () => void;
  setCurrentTranscription: (text: string) => void;
  setFilters: (filters: Partial<TranscriptionFilters>) => void;
  setSort: (sort: TranscriptionSort) => void;
  setIsProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  setIsUserSpeaking: (speaking: boolean) => void;
  setIsWaitingForSTT: (waiting: boolean) => void;
  
  // Computed getters
  getFilteredTranscriptions: () => Transcription[];
  
  // Reset actions
  reset: () => void;
  stopRecording: () => void;
}

export const useListenerStore = create<ListenerState>()(
  persist(
    (set, get) => ({
      // Initial state
      isListening: false,
      isRecording: false,
      mediaStream: null,
      mediaRecorder: null,
      vadSensitivity: DEFAULT_SETTINGS.VAD_SENSITIVITY,
      transcriptions: [],
      currentTranscription: '',
      filters: {},
      sort: { field: 'timestamp', direction: 'desc' },
      isProcessing: false,
      error: null,
      isUserSpeaking: false,
      isWaitingForSTT: false,

      // Basic setters
      setIsListening: (listening) => set({ isListening: listening }),
      setIsRecording: (recording) => set({ isRecording: recording }),
      setMediaStream: (stream) => set({ mediaStream: stream }),
      setMediaRecorder: (recorder) => set({ mediaRecorder: recorder }),
      setVadSensitivity: (sensitivity) => set({ vadSensitivity: sensitivity }),
      setTranscriptions: (transcriptions) => set({ transcriptions }),
      setCurrentTranscription: (text) => set({ currentTranscription: text }),
      setIsProcessing: (processing) => set({ isProcessing: processing }),
      setError: (error) => set({ error }),
      setIsUserSpeaking: (speaking) => set({ isUserSpeaking: speaking }),
      setIsWaitingForSTT: (waiting) => set({ isWaitingForSTT: waiting }),

      // Transcription management - Keep only last 5 transcriptions
      addTranscription: (transcription) => {
        const { transcriptions } = get();
        const updated = [transcription, ...transcriptions].slice(0, 5); // Keep only last 5
        set({
          transcriptions: updated,
          currentTranscription: '',
        });
      },

      removeTranscription: (id) => {
        const { transcriptions } = get();
        set({
          transcriptions: transcriptions.filter(t => t.id !== id),
        });
      },

      clearTranscriptions: () => {
        set({ transcriptions: [], currentTranscription: '' });
      },

      // Filters and sorting
      setFilters: (newFilters) => {
        const { filters } = get();
        set({
          filters: { ...filters, ...newFilters },
        });
      },

      setSort: (sort) => set({ sort }),

      // Computed getters
      getFilteredTranscriptions: () => {
        const { transcriptions, filters, sort } = get();
        let filtered = [...transcriptions];

        // Apply filters
        if (filters.language) {
          filtered = filtered.filter(t => t.language === filters.language);
        }

        if (filters.dateFrom) {
          filtered = filtered.filter(t => new Date(t.timestamp) >= filters.dateFrom!);
        }

        if (filters.dateTo) {
          filtered = filtered.filter(t => new Date(t.timestamp) <= filters.dateTo!);
        }

        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          filtered = filtered.filter(t => 
            t.text.toLowerCase().includes(searchLower)
          );
        }

        // Apply sorting
        filtered.sort((a, b) => {
          let aValue: any, bValue: any;
          
          switch (sort.field) {
            case 'timestamp':
              aValue = new Date(a.timestamp).getTime();
              bValue = new Date(b.timestamp).getTime();
              break;
            case 'language':
              aValue = a.language;
              bValue = b.language;
              break;
            case 'text':
              aValue = a.text;
              bValue = b.text;
              break;
            default:
              aValue = new Date(a.timestamp).getTime();
              bValue = new Date(b.timestamp).getTime();
          }

          if (sort.direction === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          }
        });

        return filtered;
      },

      // Reset actions
      stopRecording: () => {
        const { mediaRecorder, mediaStream } = get();
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
        }
        
        set({
          isListening: false,
          isRecording: false,
          mediaStream: null,
          mediaRecorder: null,
          currentTranscription: '',
          isUserSpeaking: false,
          isWaitingForSTT: false,
        });
      },

      reset: () => {
        const { mediaRecorder, mediaStream } = get();
        
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => track.stop());
        }
        
        set({
          isListening: false,
          isRecording: false,
          mediaStream: null,
          mediaRecorder: null,
          currentTranscription: '',
          filters: {},
          error: null,
          isProcessing: false,
          isUserSpeaking: false,
          isWaitingForSTT: false,
        });
      },
    }),
    {
      name: 'listener-store',
      partialize: (state) => ({
        vadSensitivity: state.vadSensitivity,
        transcriptions: state.transcriptions,
        filters: state.filters,
        sort: state.sort,
      }),
    }
  )
);
