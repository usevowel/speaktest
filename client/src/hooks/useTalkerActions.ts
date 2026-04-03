/**
 * Custom hook for Talker actions (TTS, translation, etc.)
 */

import { useCallback } from 'react';
import { useTalkerStore } from '@/stores/talkerStore';
import { translationApi, ttsApi } from '@/lib/api';
import { audio } from '@/lib/utils';
import { TTS_TO_TRANSLATION_LANGUAGE, DEFAULT_VOICE_BY_LANGUAGE } from '@/constants';
import { toast } from '@/hooks/useToast';
import { isValidVoice, getCachedVoices } from '@/lib/voices-cache';

export function useTalkerActions() {
  const {
    sourceLanguage,
    targetLanguage,
    voice,
    speed,
    setIsPlaying,
    setIsTranslating,
    setIsLoadingAudio,
    setCurrentAudio,
    currentAudio,
    nextPhrase,
  } = useTalkerStore();

  /**
   * Play a phrase with TTS
   */
  const playPhrase = useCallback(async (text: string) => {
    try {
      // Validate input text
      console.log('🎤 playPhrase called with:', { 
        text, 
        textType: typeof text, 
        textLength: text?.length,
        trimmedLength: text?.trim()?.length 
      });
      
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        console.error('❌ Invalid text input:', { text, type: typeof text });
        throw new Error('Text is required and cannot be empty');
      }

      setIsTranslating(true);

      let textToSpeak = text.trim();
      console.log('📝 Initial textToSpeak:', { textToSpeak, length: textToSpeak.length });

      // Get the target language name for translation
      const targetLangName = TTS_TO_TRANSLATION_LANGUAGE[targetLanguage];
      
      // Normalize language names for comparison (case-insensitive)
      // Use default 'english' if sourceLanguage is not set
      const normalizedSourceLang = (sourceLanguage?.toLowerCase().trim() || 'english').toLowerCase();
      const normalizedTargetLang = (targetLangName?.toLowerCase().trim() || 'english').toLowerCase();
      
      console.log('🌐 Language settings:', { 
        sourceLanguage: sourceLanguage || 'undefined (using default: english)',
        targetLanguage, 
        targetLangName,
        normalizedSourceLang,
        normalizedTargetLang,
        needsTranslation: normalizedSourceLang !== normalizedTargetLang
      });

      // Translate if source and target languages are different
      // This ensures the text is in the correct language for TTS
      if (normalizedSourceLang !== normalizedTargetLang) {
        console.log('🔄 Translation needed:', { 
          from: normalizedSourceLang, 
          to: normalizedTargetLang,
          originalText: textToSpeak.substring(0, 50)
        });
        
        const translationResponse = await translationApi.translate({
          text: textToSpeak,
          sourceLanguage: normalizedSourceLang,
          targetLanguage: normalizedTargetLang,
        });

        console.log('🔄 Translation response:', { 
          success: translationResponse.success, 
          translatedText: translationResponse.data?.translatedText?.substring(0, 50),
          translatedTextLength: translationResponse.data?.translatedText?.length,
          hasData: !!translationResponse.data,
          error: translationResponse.error 
        });

        if (translationResponse.success && translationResponse.data) {
          const translatedText = translationResponse.data.translatedText?.trim() || '';
          if (translatedText.length > 0) {
            textToSpeak = translatedText;
            console.log('✅ Using translated text:', { textToSpeak: textToSpeak.substring(0, 50), length: textToSpeak.length });
          } else {
            console.error('❌ Translation returned empty text, using original text:', {
              originalText: textToSpeak,
              responseData: translationResponse.data
            });
            // Don't use translated text if it's empty - keep original
          }
        } else {
          console.error('❌ Translation failed, using original text:', {
            error: translationResponse.error,
            success: translationResponse.success,
            hasData: !!translationResponse.data
          });
        }
      } else {
        console.log('ℹ️ No translation needed (same language):', { 
          source: normalizedSourceLang, 
          target: normalizedTargetLang 
        });
      }

      // Validate textToSpeak before making TTS request
      if (!textToSpeak || textToSpeak.trim().length === 0) {
        console.error('❌ textToSpeak is empty after processing:', { textToSpeak, originalText: text });
        throw new Error('Text to speak is empty after processing');
      }

      setIsTranslating(false);

      // Use subscribed values from the hook (reactive)
      const currentVoice = voice;
      const currentSpeed = speed;
      
      console.log('🎵 Current voice from store:', { 
        voice: currentVoice, 
        speed: currentSpeed,
        targetLanguage,
        voiceType: typeof currentVoice,
        voiceLength: currentVoice?.length
      });

      // Validate target language
      if (!targetLanguage) {
        throw new Error('Target language is required');
      }

      // Validate and verify voice
      let voiceToUse = currentVoice || DEFAULT_VOICE_BY_LANGUAGE[targetLanguage] || 'Ashley';
      
      if (!currentVoice || currentVoice.trim().length === 0) {
        console.warn('⚠️ No voice set, using default for language');
        voiceToUse = DEFAULT_VOICE_BY_LANGUAGE[targetLanguage] || 'Ashley';
        useTalkerStore.getState().setVoice(voiceToUse);
      } else {
        // Verify voice is valid for the language
        const cachedVoices = getCachedVoices(targetLanguage);
        if (cachedVoices) {
          if (!cachedVoices.includes(voiceToUse)) {
            console.warn(`⚠️ Voice "${voiceToUse}" not found in cached voices for "${targetLanguage}", using first available voice`);
            voiceToUse = cachedVoices[0] || DEFAULT_VOICE_BY_LANGUAGE[targetLanguage] || 'Ashley';
            useTalkerStore.getState().setVoice(voiceToUse);
          } else {
            console.log(`✅ Voice "${voiceToUse}" validated for language "${targetLanguage}"`);
          }
        } else {
          // If not cached, fetch voices to validate
          console.log(`🔄 Voices not cached for "${targetLanguage}", fetching to validate voice`);
          try {
            const voicesResponse = await ttsApi.getVoices(targetLanguage);
            if (voicesResponse.success && voicesResponse.data && voicesResponse.data.length > 0) {
              if (!voicesResponse.data.includes(voiceToUse)) {
                console.warn(`⚠️ Voice "${voiceToUse}" not found in API voices for "${targetLanguage}", using first available: ${voicesResponse.data[0]}`);
                voiceToUse = voicesResponse.data[0];
                useTalkerStore.getState().setVoice(voiceToUse);
              } else {
                console.log(`✅ Voice "${voiceToUse}" validated via API for language "${targetLanguage}"`);
              }
            }
          } catch (error) {
            console.warn('Failed to validate voice via API, proceeding with current voice:', error);
          }
        }
      }

      // Convert to speech
      console.log('🎵 TTS Request:', { 
        text: textToSpeak.substring(0, 30) + (textToSpeak.length > 30 ? '...' : ''), 
        language: targetLanguage, 
        voice: voiceToUse, 
        speed: currentSpeed,
        voiceFromStore: currentVoice,
        voiceType: typeof voiceToUse 
      });
      const ttsResponse = await ttsApi.synthesize({
        text: textToSpeak,
        language: targetLanguage,
        voice: voiceToUse,
        speed: currentSpeed,
      });
      
      if (ttsResponse.success && ttsResponse.data) {
        // TTS completed, now loading audio
        setIsTranslating(false);
        setIsLoadingAudio(true);

        // Stop any currently playing audio
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          setCurrentAudio(null); // Clear reference immediately
        }

        // Create and play new audio
        const audioElement = audio.createAudioElement(ttsResponse.data.audioUrl);

        // Set up event handlers
        audioElement.addEventListener('play', () => {
          console.log('Audio started playing');
          setIsPlaying(true);
          setIsLoadingAudio(false);
        });

        audioElement.addEventListener('ended', () => {
          console.log('Audio ended');
          setIsPlaying(false);
          setCurrentAudio(null);

          // Auto-select next phrase after 0.5 second delay
          setTimeout(() => {
            nextPhrase();
          }, 500);
        });

        audioElement.addEventListener('error', (e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
          setIsLoadingAudio(false);
          setCurrentAudio(null);
        });

        setCurrentAudio(audioElement);
        await audioElement.play();
      } else {
        throw new Error(ttsResponse.error || 'TTS failed');
      }
    } catch (error) {
      console.error('Error playing phrase:', error);
      setIsPlaying(false);
      setIsTranslating(false);
      setCurrentAudio(null);
      
      // Ignore AbortError - happens when play() is interrupted (user navigated away, stopped playback, etc.)
      // This is expected behavior and not a real error
      if (error instanceof Error && 
          (error.name === 'AbortError' || 
           error.message.includes('interrupted') ||
           error.message.includes('removed from the document'))) {
        // Swallow the exception - this is a race condition, not a real error
        return;
      }
      
      // Show error to user only for real errors
      toast({
        title: "Failed to play phrase",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
    }, [sourceLanguage, targetLanguage, voice, speed, currentAudio, setIsPlaying, setIsTranslating, setCurrentAudio, nextPhrase]);

  /**
   * Stop current playback
   */
  const stopPlayback = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setIsPlaying(false);
    setIsLoadingAudio(false);
    setCurrentAudio(null);
  }, [currentAudio, setIsPlaying, setIsLoadingAudio, setCurrentAudio]);

  /**
   * Pause current playback
   */
  const pausePlayback = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
    }
    setIsPlaying(false);
  }, [currentAudio, setIsPlaying]);

  /**
   * Resume current playback
   */
  const resumePlayback = useCallback(async () => {
    if (currentAudio) {
      try {
        await currentAudio.play();
        setIsPlaying(true);
      } catch (error) {
        // Ignore AbortError - same race condition as above
        if (error instanceof Error && 
            (error.name === 'AbortError' || 
             error.message.includes('interrupted') ||
             error.message.includes('removed from the document'))) {
          return;
        }
        console.error('Error resuming playback:', error);
      }
    }
  }, [currentAudio, setIsPlaying]);

  /**
   * Check if TTS service is available
   */
  const checkTTSStatus = useCallback(async () => {
    try {
      const response = await ttsApi.getStatus();
      return response.success && response.data?.available;
    } catch (error) {
      console.error('Error checking TTS status:', error);
      return false;
    }
  }, []);

  return {
    playPhrase,
    stopPlayback,
    pausePlayback,
    resumePlayback,
    checkTTSStatus,
  };
}
