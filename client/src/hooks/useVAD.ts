/**
 * Voice Activity Detection (VAD) hook
 */

import { useCallback, useRef, useState } from 'react';
import { useListenerStore } from '@/stores/listenerStore';
import { audio } from '@/lib/utils';

interface VADOptions {
  sensitivity: number;
  minSilenceDuration: number;
  maxRecordingDuration: number;
}

export function useVAD() {
  const {
    vadSensitivity,
    setMediaStream,
    setMediaRecorder,
    setIsRecording,
    setError,
  } = useListenerStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);

  /**
   * Initialize VAD with microphone access
   */
  const initializeVAD = useCallback(async () => {
    try {
      setError(null);
      
      // Get microphone access
      const stream = await audio.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context and analyser
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setMediaStream(stream);
      setIsInitialized(true);

      return { stream, audioContext, analyser };
    } catch (error) {
      console.error('Failed to initialize VAD:', error);
      setError(error instanceof Error ? error.message : 'Failed to access microphone');
      throw error;
    }
  }, [setMediaStream, setError]);

  /**
   * Calculate audio volume level
   */
  const getVolumeLevel = useCallback((): number => {
    if (!analyserRef.current) return 0;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }

    return sum / dataArray.length / 255; // Normalize to 0-1
  }, []);

  /**
   * Start VAD monitoring
   */
  const startVAD = useCallback(async (
    onSpeechStart: () => void,
    onSpeechEnd: () => void,
    options: Partial<VADOptions> = {}
  ) => {
    const vadOptions: VADOptions = {
      sensitivity: options.sensitivity ?? vadSensitivity,
      minSilenceDuration: options.minSilenceDuration ?? 1000,
      maxRecordingDuration: options.maxRecordingDuration ?? 30000,
    };

    if (!isInitialized) {
      await initializeVAD();
    }

    let isSpeaking = false;
    silenceStartRef.current = null;
    recordingStartRef.current = null;

    vadIntervalRef.current = setInterval(() => {
      // Skip VAD processing if paused (e.g., during TTS playback)
      if (isPaused) {
        return;
      }

      const volume = getVolumeLevel();
      const now = Date.now();

      if (volume > vadOptions.sensitivity) {
        // Speech detected
        if (!isSpeaking) {
          isSpeaking = true;
          silenceStartRef.current = null;
          recordingStartRef.current = now;
          onSpeechStart();
        }
      } else {
        // Silence detected
        if (isSpeaking && !silenceStartRef.current) {
          silenceStartRef.current = now;
        }

        // Check if silence duration exceeded threshold
        if (
          isSpeaking &&
          silenceStartRef.current &&
          now - silenceStartRef.current > vadOptions.minSilenceDuration
        ) {
          isSpeaking = false;
          silenceStartRef.current = null;
          onSpeechEnd();
        }
      }

      // Check max recording duration
      if (
        isSpeaking &&
        recordingStartRef.current &&
        now - recordingStartRef.current > vadOptions.maxRecordingDuration
      ) {
        isSpeaking = false;
        recordingStartRef.current = null;
        onSpeechEnd();
      }
    }, 100); // Check every 100ms
  }, [isInitialized, vadSensitivity, initializeVAD, getVolumeLevel, isPaused]);

  /**
   * Stop VAD monitoring
   */
  const stopVAD = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    silenceStartRef.current = null;
    recordingStartRef.current = null;
  }, []);

  /**
   * Create media recorder for audio capture
   */
  const createMediaRecorder = useCallback((
    stream: MediaStream,
    onDataAvailable: (audioBlob: Blob) => void
  ): MediaRecorder => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    const audioChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      onDataAvailable(audioBlob);
      audioChunks.length = 0; // Clear chunks
    };

    mediaRecorder.onstart = () => {
      setIsRecording(true);
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      setError('Recording error occurred');
      setIsRecording(false);
    };

    setMediaRecorder(mediaRecorder);
    return mediaRecorder;
  }, [setMediaRecorder, setIsRecording, setError]);

  /**
   * Pause VAD monitoring (e.g., during TTS playback)
   */
  const pauseVAD = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Resume VAD monitoring
   */
  const resumeVAD = useCallback(() => {
    setIsPaused(false);
  }, []);

  /**
   * Cleanup VAD resources
   */
  const cleanup = useCallback(() => {
    stopVAD();
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setIsInitialized(false);
    setIsPaused(false);
  }, [stopVAD]);

  return {
    isInitialized,
    initializeVAD,
    startVAD,
    stopVAD,
    pauseVAD,
    resumeVAD,
    createMediaRecorder,
    getVolumeLevel,
    cleanup,
  };
}
