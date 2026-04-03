/**
 * Custom hook for Listener actions (STT, transcription management, etc.)
 * 
 * @deprecated This hook is deprecated. Please use `useListening` hook instead.
 * This hook will be removed in a future version.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useListenerStore } from '@/stores/listenerStore';
import { useTalkerStore } from '@/stores/talkerStore';
import { sttApi, translationApi } from '@/lib/api';
import { useVAD } from './useVAD';
import { generateId } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { TTS_TO_TRANSLATION_LANGUAGE } from '@/constants';
import type { Transcription, STTLanguage } from '@/shared/types';

export function useListenerActions() {
  const {
    mediaStream,
    setIsListening,
    setCurrentTranscription,
    addTranscription,
    setTranscriptions,
    clearTranscriptions,
    removeTranscription,
    setIsProcessing,
    setError,
    stopRecording,
  } = useListenerStore();

  const {
    initializeVAD,
    startVAD,
    stopVAD,
    pauseVAD,
    resumeVAD,
    createMediaRecorder,
    cleanup,
  } = useVAD();

  // Track TTS playback state to pause/resume listener
  const { isPlaying: isTTSPlaying, sourceLanguage, targetLanguage } = useTalkerStore();
  const { isListening } = useListenerStore();
  const wasPlayingRef = useRef(false);

  /**
   * Monitor TTS playback and pause/resume listener accordingly
   */
  useEffect(() => {
    if (!isListening) {
      wasPlayingRef.current = false; // Reset when listener stops
      return; // Don't do anything if listener isn't active
    }

    // TTS just started playing - pause listener
    if (isTTSPlaying && !wasPlayingRef.current) {
      console.log('TTS started - pausing listener');
      pauseVAD();
      wasPlayingRef.current = true;
    }
    
    // TTS just finished playing - resume listener
    if (!isTTSPlaying && wasPlayingRef.current) {
      console.log('TTS ended - resuming listener');
      resumeVAD();
      wasPlayingRef.current = false;
    }
  }, [isTTSPlaying, isListening, pauseVAD, resumeVAD]);

  /**
   * Start listening with VAD
   */
  const startListening = useCallback(async () => {
    try {
      setError(null);
      setIsProcessing(true);

      // Initialize VAD if not already done
      const { stream } = await initializeVAD();
      
      let currentRecorder: MediaRecorder | null = null;

      // Handle speech start
      const handleSpeechStart = () => {
        console.log('Speech detected - starting recording');
        setCurrentTranscription('Listening...');
        
        currentRecorder = createMediaRecorder(stream, async (audioBlob) => {
          await processAudioBlob(audioBlob);
        });
        
        currentRecorder.start();
      };

      // Handle speech end
      const handleSpeechEnd = () => {
        console.log('Speech ended - stopping recording');
        if (currentRecorder && currentRecorder.state === 'recording') {
          currentRecorder.stop();
        }
        currentRecorder = null;
      };

      // Start VAD monitoring
      await startVAD(handleSpeechStart, handleSpeechEnd);
      
      setIsListening(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error starting listener:', error);
      setError(error instanceof Error ? error.message : 'Failed to start listening');
      setIsProcessing(false);
    }
  }, [
    initializeVAD,
    startVAD,
    createMediaRecorder,
    setIsListening,
    setCurrentTranscription,
    setIsProcessing,
    setError,
    targetLanguage,
  ]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    stopVAD();
    stopRecording();
    setCurrentTranscription('');
    wasPlayingRef.current = false; // Reset TTS tracking
  }, [stopVAD, stopRecording, setCurrentTranscription]);

  /**
   * Process audio blob with STT and translate to source language
   * Flow: User speaks in targetLanguage -> STT transcribes in targetLanguage -> Translate to sourceLanguage
   */
  const processAudioBlob = useCallback(async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      setCurrentTranscription('Processing...');

      // Step 1: Transcribe in target language (user speaks in agent's language)
      const sttLanguage = TTS_TO_TRANSLATION_LANGUAGE[targetLanguage] as STTLanguage;
      const sttResponse = await sttApi.transcribe(audioBlob, sttLanguage);
      
      if (!sttResponse.success || !sttResponse.data) {
        setError(sttResponse.error || 'Transcription failed');
        setIsProcessing(false);
        setCurrentTranscription('');
        return;
      }
      
      const targetText = sttResponse.data.text;
      let finalText = targetText;
      let finalLanguage = sourceLanguage as STTLanguage;
      
      // Step 2: Translate from target language to source language if different
      if (sttLanguage !== sourceLanguage) {
        try {
          setCurrentTranscription('Translating...');
          const translationResponse = await translationApi.translate({
            text: targetText,
            sourceLanguage: sttLanguage,
            targetLanguage: sourceLanguage,
          });
          
          if (translationResponse.success && translationResponse.data) {
            finalText = translationResponse.data.translatedText;
            console.log(`Translated: "${targetText}" -> "${finalText}"`);
          } else {
            console.warn('Translation failed, using original transcription:', translationResponse.error);
            // Fallback to original text if translation fails
          }
        } catch (translationError) {
          console.error('Translation error:', translationError);
          // Fallback to original text if translation fails
        }
      }
      
      // Step 3: Create transcription with translated text (in source language)
      const transcription: Transcription = {
        id: generateId(),
        text: finalText,
        language: finalLanguage,
        timestamp: new Date(),
        confidence: sttResponse.data.confidence,
      };

      // Add to local state (in-memory only, limited to 5)
      addTranscription(transcription);
      
      // Show toast notification with translated text
      toast({
        title: "Transcription",
        description: finalText,
        duration: Infinity, // Stay until manually cleared
        variant: "transcription",
      });
    } catch (error) {
      console.error('Error processing audio:', error);
      setError(error instanceof Error ? error.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
      setCurrentTranscription('');
    }
  }, [sourceLanguage, targetLanguage, addTranscription, setIsProcessing, setCurrentTranscription, setError]);

  /**
   * Load transcriptions from server (not used in simplified version)
   */
  const loadTranscriptions = useCallback(async () => {
    // Simplified version - no server loading, purely in-memory
    // Transcriptions are managed locally and limited to 5
  }, []);

  /**
   * Delete a transcription (not used in simplified version)
   */
  const deleteTranscription = useCallback(async (id: string) => {
    // Simplified version - transcriptions auto-expire when limit exceeded
    removeTranscription(id);
  }, [removeTranscription]);

  /**
   * Clear all transcriptions
   */
  const clearAllTranscriptions = useCallback(async () => {
    clearTranscriptions();
  }, [clearTranscriptions]);

  /**
   * Check STT service status
   */
  const checkSTTStatus = useCallback(async () => {
    try {
      const response = await sttApi.getStatus();
      return response.success && response.data?.available;
    } catch (error) {
      console.error('Error checking STT status:', error);
      return false;
    }
  }, []);

  /**
   * Cleanup resources
   */
  const cleanupListener = useCallback(() => {
    stopListening();
    cleanup();
  }, [stopListening, cleanup]);

  return {
    startListening,
    stopListening,
    processAudioBlob,
    loadTranscriptions,
    deleteTranscription,
    clearAllTranscriptions,
    checkSTTStatus,
    cleanupListener,
  };
}
