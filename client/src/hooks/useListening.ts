/**
 * useListening Hook
 * 
 * React hook that provides a unified interface for managing listening functionality.
 * Wraps the listeningManager service and integrates with the listener store.
 */

import { useCallback, useEffect, useRef } from 'react';
import { listeningManager } from '@/lib/listeningManager';
import { useListenerStore } from '@/stores/listenerStore';
import { useTalkerStore } from '@/stores/talkerStore';
import { sttApi } from '@/lib/api';
import { TTS_TO_TRANSLATION_LANGUAGE } from '@/constants';
import type { Transcription, STTLanguage } from '@/shared/types';

/**
 * Hook for managing listening functionality
 */
export function useListening() {
  const {
    vadSensitivity,
    isListening,
    isProcessing,
    setIsListening,
    setCurrentTranscription,
    addTranscription,
    setIsProcessing,
    setError,
    setMediaStream,
    setIsUserSpeaking,
    setIsWaitingForSTT,
  } = useListenerStore();
  
  const { isPlaying: isTTSPlaying, sourceLanguage, targetLanguage } = useTalkerStore();
  const wasPlayingRef = useRef(false);
  
  // Use refs to store the latest callbacks to avoid recreating them
  const callbacksRef = useRef({
    setCurrentTranscription,
    addTranscription,
    setError,
    setIsListening,
    setMediaStream,
    setIsUserSpeaking,
    setIsWaitingForSTT,
  });
  
  // Update refs when store setters change
  useEffect(() => {
    callbacksRef.current = {
      setCurrentTranscription,
      addTranscription,
      setError,
      setIsListening,
      setMediaStream,
      setIsUserSpeaking,
      setIsWaitingForSTT,
    };
  }, [setCurrentTranscription, addTranscription, setError, setIsListening, setMediaStream, setIsUserSpeaking, setIsWaitingForSTT]);
  
  /**
   * Update listening manager configuration when settings change
   * STT listens in targetLanguage (user speaks in agent's language)
   * Translation outputs to sourceLanguage (user's language)
   */
  useEffect(() => {
    listeningManager.setSourceLanguage(sourceLanguage);
    // Convert TTS language code to STT language name
    const sttLanguage = TTS_TO_TRANSLATION_LANGUAGE[targetLanguage] as STTLanguage;
    listeningManager.setTargetLanguage(sttLanguage);
    listeningManager.setVADSensitivity(vadSensitivity);
  }, [sourceLanguage, targetLanguage, vadSensitivity]);
  
  /**
   * Set up callbacks for listening events (only once on mount)
   */
  useEffect(() => {
    listeningManager.setCallbacks({
      onSpeechStart: () => {
        // Speech detected - user is speaking
        callbacksRef.current.setIsUserSpeaking(true);
        callbacksRef.current.setIsWaitingForSTT(false);
      },
      onSpeechEnd: () => {
        // Speech ended - now waiting for STT
        callbacksRef.current.setIsUserSpeaking(false);
        callbacksRef.current.setIsWaitingForSTT(true);
      },
      onTranscription: (transcription: Transcription) => {
        callbacksRef.current.addTranscription(transcription);
        callbacksRef.current.setCurrentTranscription('');
        callbacksRef.current.setIsWaitingForSTT(false);
      },
      onError: (error: string) => {
        callbacksRef.current.setError(error);
        callbacksRef.current.setIsUserSpeaking(false);
        callbacksRef.current.setIsWaitingForSTT(false);
      },
      onStateChange: (listening: boolean) => {
        callbacksRef.current.setIsListening(listening);
        const state = listeningManager.getState();
        callbacksRef.current.setMediaStream(state.mediaStream);
        // Reset speaking states when listening stops
        if (!listening) {
          callbacksRef.current.setIsUserSpeaking(false);
          callbacksRef.current.setIsWaitingForSTT(false);
        }
      },
    });
    // Only run once on mount - using refs ensures we always have latest callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  /**
   * Monitor TTS playback and pause/resume listener accordingly
   */
  useEffect(() => {
    if (!isListening) {
      wasPlayingRef.current = false;
      return;
    }
    
    // TTS just started playing - pause listener
    if (isTTSPlaying && !wasPlayingRef.current) {
      console.log('TTS started - pausing listener');
      listeningManager.pauseListening();
      wasPlayingRef.current = true;
    }
    
    // TTS just finished playing - resume listener
    if (!isTTSPlaying && wasPlayingRef.current) {
      console.log('TTS ended - resuming listener');
      listeningManager.resumeListening();
      wasPlayingRef.current = false;
    }
  }, [isTTSPlaying, isListening]);
  
  /**
   * Start listening
   */
  const startListening = useCallback(async () => {
    try {
      console.log('useListening: Starting listening...');
      setError(null);
      setIsProcessing(true);
      
      await listeningManager.startListening();
      
      console.log('useListening: Listening started successfully');
      setIsProcessing(false);
    } catch (error) {
      console.error('useListening: Error starting listening:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start listening';
      setError(errorMessage);
      setIsProcessing(false);
      setIsListening(false); // Ensure state is reset on error
    }
  }, [setError, setIsProcessing, setIsListening]);
  
  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    listeningManager.stopListening();
    setCurrentTranscription('');
    setIsUserSpeaking(false);
    setIsWaitingForSTT(false);
    wasPlayingRef.current = false; // Reset TTS tracking
  }, [setCurrentTranscription, setIsUserSpeaking, setIsWaitingForSTT]);
  
  /**
   * Toggle listening state
   */
  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);
  
  /**
   * Check STT service status
   */
  const checkSTTStatus = useCallback(async (): Promise<boolean> => {
    try {
      const response = await sttApi.getStatus();
      return response.success && response.data?.available === true;
    } catch (error) {
      console.error('Error checking STT status:', error);
      return false;
    }
  }, []);
  
  /**
   * Get current listening state from manager
   */
  const getState = useCallback(() => {
    return listeningManager.getState();
  }, []);
  
  /**
   * Cleanup function - memoized to prevent recreation
   */
  const cleanup = useCallback(() => {
    listeningManager.cleanup();
    setCurrentTranscription('');
    wasPlayingRef.current = false;
  }, [setCurrentTranscription]);
  
  return {
    // State
    isListening,
    isProcessing,
    
    // Actions
    startListening,
    stopListening,
    toggleListening,
    checkSTTStatus,
    getState,
    
    // Cleanup (for explicit cleanup when needed)
    cleanup,
  };
}
