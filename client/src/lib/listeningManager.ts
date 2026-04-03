/**
 * Listening Manager Service
 * 
 * Centralized service for managing all listening functionality including:
 * - Microphone access and initialization
 * - Voice Activity Detection (VAD) using @ricky0123/vad-web (loaded from CDN)
 * - Audio recording and processing
 * - Speech-to-Text transcription
 * - State management
 */

// Import types only for TypeScript - the actual library is loaded from CDN
import type { MicVAD } from '@ricky0123/vad-web';
import { sttApi, translationApi } from './api';
import { generateId } from './utils';
import { toast } from '@/hooks/useToast';
import type { Transcription, STTLanguage } from '@/shared/types';

// Declare global vad object from CDN
declare global {
  interface Window {
    vad: {
      MicVAD: typeof MicVAD;
    };
  }
}

/**
 * Callbacks for listening events
 */
interface ListeningCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onTranscription?: (transcription: Transcription) => void;
  onError?: (error: string) => void;
  onStateChange?: (isListening: boolean) => void;
}

/**
 * Listening Manager class
 */
class ListeningManager {
  private micVAD: MicVAD | null = null;
  private mediaStream: MediaStream | null = null;
  
  private isInitialized = false;
  private isListening = false;
  private isPaused = false;
  
  private sourceLanguage: string = 'english'; // User's language (for translation output)
  private targetLanguage: STTLanguage = 'english'; // Agent's language (for STT - user speaks in this language)
  private vadSensitivity: number = 0.75; // Default sensitivity for ricky123 VAD (0-1)
  
  private callbacks: ListeningCallbacks = {};
  
  /**
   * Set source language (user's language) for translation output
   */
  setSourceLanguage(language: string): void {
    this.sourceLanguage = language;
  }
  
  /**
   * Set target language (agent's language) for STT - user speaks in this language
   */
  setTargetLanguage(language: STTLanguage): void {
    this.targetLanguage = language;
  }
  
  /**
   * Set VAD sensitivity (0-1, where higher is more sensitive)
   */
  setVADSensitivity(sensitivity: number): void {
    this.vadSensitivity = Math.max(0, Math.min(1, sensitivity)); // Clamp between 0 and 1
    // Note: ricky123 VAD doesn't support runtime sensitivity changes
    // This would require reinitializing the VAD, which we'll do on next start
  }
  
  /**
   * Set callbacks for listening events
   */
  setCallbacks(callbacks: ListeningCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  /**
   * Convert Float32Array audio to Blob (WAV format)
   */
  private float32ArrayToWavBlob(audioData: Float32Array, sampleRate: number = 16000): Blob {
    const length = audioData.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float32 to int16
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const s = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  /**
   * Process audio from VAD with STT service and translate to source language
   * Flow: User speaks in targetLanguage -> STT transcribes in targetLanguage -> Translate to sourceLanguage
   */
  private async processAudio(audioData: Float32Array): Promise<void> {
    try {
      // Convert Float32Array to WAV Blob
      const audioBlob = this.float32ArrayToWavBlob(audioData);
      
      // Step 1: Transcribe in target language (user speaks in agent's language)
      const sttResponse = await sttApi.transcribe(audioBlob, this.targetLanguage);
      
      if (!sttResponse.success || !sttResponse.data) {
        this.callbacks.onError?.(sttResponse.error || 'Transcription failed');
        return;
      }
      
      const targetText = sttResponse.data.text;
      let finalText = targetText;
      let finalLanguage = this.sourceLanguage as STTLanguage;
      
      // Step 2: Translate from target language to source language if different
      if (this.targetLanguage !== this.sourceLanguage) {
        try {
          const translationResponse = await translationApi.translate({
            text: targetText,
            sourceLanguage: this.targetLanguage,
            targetLanguage: this.sourceLanguage,
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
      
      this.callbacks.onTranscription?.(transcription);
      
      // Show toast notification with translated text
      toast({
        title: "Transcription",
        description: finalText,
        duration: Infinity,
        variant: "transcription",
      });
    } catch (error) {
      console.error('Error processing audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      this.callbacks.onError?.(errorMessage);
    }
  }
  
  /**
   * Initialize VAD with ricky123 VAD
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.micVAD) {
      return; // Already initialized
    }
    
    try {
      console.log('Initializing ricky123 VAD...');
      
      // Cleanup existing VAD if any
      if (this.micVAD) {
        this.micVAD.pause();
        this.micVAD = null;
      }
      
      // Check if VAD is loaded from CDN
      if (!window.vad || !window.vad.MicVAD) {
        throw new Error('VAD library not loaded. Please ensure the CDN scripts are loaded in index.html');
      }
      
      // Configure ONNX Runtime WASM paths and optimize for performance
      if (typeof window !== 'undefined' && (window as any).ort) {
        const ort = (window as any).ort;
        if (ort.env && ort.env.wasm) {
          // Use latest version path for WASM files
          ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
          // Optimize ONNX Runtime for better performance
          // Use single-threaded mode for lighter weight (reduces memory overhead)
          ort.env.wasm.numThreads = 1;
          // Enable SIMD for faster processing if available
          ort.env.wasm.simd = true;
        }
      }
      
      // Initialize ricky123 VAD (loaded from CDN)
      // Optimized configuration for lighter weight and better performance
      this.micVAD = await window.vad.MicVAD.new({
        baseAssetPath: 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@latest/dist/',
        onnxWASMBasePath: 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/',
        // Use v5 model - newer, more efficient than legacy model
        model: 'v5',
        // Explicitly use AudioWorklet for better performance (more efficient than ScriptProcessor)
        processorType: 'AudioWorklet',
        // Optimize worklet options for lighter processing
        workletOptions: {
          // Reduce number of input channels if possible (already mono, but explicit)
          numberOfInputs: 1,
          numberOfOutputs: 0, // No output needed for VAD
        },
        onSpeechStart: () => {
          console.log('Speech detected - starting recording');
          this.callbacks.onSpeechStart?.();
        },
        onSpeechEnd: async (audioData: Float32Array) => {
          console.log('Speech ended - processing audio');
          this.callbacks.onSpeechEnd?.();
          await this.processAudio(audioData);
        },
        onVADMisfire: () => {
          console.log('VAD misfire detected');
        },
        // Use the sensitivity setting (ricky123 VAD uses positiveSpeechThreshold)
        // Higher sensitivity = lower threshold (more sensitive)
        // We invert it: our 0.75 sensitivity = 0.25 threshold
        positiveSpeechThreshold: 1 - this.vadSensitivity,
        negativeSpeechThreshold: 0.5 - (this.vadSensitivity * 0.3),
        // Optimized timing parameters for lighter processing:
        // - Reduced redemptionMs from 2000ms to 1400ms (default) for faster response
        // - Reduced preSpeechPadMs from 300ms to 200ms to reduce buffer overhead
        // - Keep minSpeechMs at 250ms for good balance
        redemptionMs: 1400, // Milliseconds to wait before considering speech ended (reduced from 2000ms)
        preSpeechPadMs: 200, // Milliseconds of audio to include before speech starts (reduced from 300ms)
        minSpeechMs: 250, // Minimum speech duration in milliseconds
      });
      
      // Try to capture the media stream from the VAD instance for cleanup
      // The ricky123 VAD library creates the stream internally during initialization
      const vadAny = this.micVAD as any;
      if (vadAny.mediaStream) {
        this.mediaStream = vadAny.mediaStream;
      } else if (vadAny.stream) {
        this.mediaStream = vadAny.stream;
      } else if (vadAny.micStream) {
        this.mediaStream = vadAny.micStream;
      }
      
      this.isInitialized = true;
      console.log('ricky123 VAD initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ricky123 VAD:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to initialize voice activity detection';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings and try again.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone and try again.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage = 'Microphone is already in use by another application. Please close other applications using the microphone and try again.';
        } else {
          errorMessage = error.message || 'Failed to initialize voice activity detection';
        }
      }
      
      this.callbacks.onError?.(errorMessage);
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Start listening
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('Already listening, skipping start');
      return; // Already listening
    }
    
    try {
      console.log('Starting listening...');
      
      // Initialize if not already done
      if (!this.isInitialized || !this.micVAD) {
        console.log('Initializing VAD...');
        await this.initialize();
        console.log('VAD initialized successfully');
      } else {
        console.log('VAD already initialized');
      }
      
      if (!this.micVAD) {
        throw new Error('VAD not initialized');
      }
      
      // Start VAD
      console.log('Starting VAD monitoring...');
      this.micVAD.start();
      
      // Access and store the media stream from VAD instance for cleanup
      // The ricky123 VAD library exposes the stream via the micVAD instance
      if (this.micVAD && (this.micVAD as any).mediaStream) {
        this.mediaStream = (this.micVAD as any).mediaStream;
      }
      
      this.isListening = true;
      this.isPaused = false;
      this.callbacks.onStateChange?.(true);
      
      console.log('Listening started successfully');
    } catch (error) {
      console.error('Error starting listening:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start listening';
      this.callbacks.onError?.(errorMessage);
      // Reset state on error
      this.isListening = false;
      this.callbacks.onStateChange?.(false);
      throw error;
    }
  }
  
  /**
   * Stop listening
   */
  stopListening(): void {
    if (!this.isListening) {
      return; // Not listening
    }
    
    // Stop VAD
    if (this.micVAD) {
      this.micVAD.pause();
    }
    
    // Close microphone tracks to release the microphone
    this.closeMicrophone();
    
    this.isListening = false;
    this.isPaused = false;
    this.callbacks.onStateChange?.(false);
    
    console.log('Listening stopped');
  }
  
  /**
   * Close microphone stream by stopping all tracks
   * The ricky123 VAD library manages the stream internally, so we try to access it
   * through various possible properties. If we can't access it directly, the VAD's
   * pause() method should handle cleanup, but we try to be explicit about closing tracks.
   */
  private closeMicrophone(): void {
    // Try multiple ways to access the media stream from the VAD instance
    if (!this.mediaStream && this.micVAD) {
      // Try common property names that VAD libraries might use
      const vadAny = this.micVAD as any;
      if (vadAny.mediaStream) {
        this.mediaStream = vadAny.mediaStream;
      } else if (vadAny.stream) {
        this.mediaStream = vadAny.stream;
      } else if (vadAny.micStream) {
        this.mediaStream = vadAny.micStream;
      } else if (vadAny.audioContext) {
        // Try to get stream from audio context source node
        const audioContext = vadAny.audioContext;
        if (audioContext && audioContext.source) {
          const source = audioContext.source;
          if (source.mediaStream) {
            this.mediaStream = source.mediaStream;
          }
        }
      }
    }
    
    // Stop all tracks in the media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => {
        if (track.readyState !== 'ended') {
          track.stop();
          console.log('Microphone track stopped:', track.kind);
        }
      });
      this.mediaStream = null;
    } else {
      // If we couldn't access the stream directly, log that VAD has been paused
      // The ricky123 VAD library should handle stream cleanup when paused
      console.log('VAD paused - microphone cleanup handled by VAD library');
    }
  }
  
  /**
   * Pause listening (e.g., during TTS playback)
   */
  pauseListening(): void {
    if (!this.isListening || !this.micVAD) {
      return;
    }
    
    this.micVAD.pause();
    this.isPaused = true;
    console.log('Listening paused');
  }
  
  /**
   * Resume listening
   */
  resumeListening(): void {
    if (!this.isListening || !this.micVAD) {
      return;
    }
    
    this.micVAD.start();
    this.isPaused = false;
    console.log('Listening resumed');
  }
  
  /**
   * Cleanup all resources
   */
  cleanup(): void {
    this.stopListening();
    
    // Cleanup VAD
    if (this.micVAD) {
      try {
        this.micVAD.pause();
        // Note: ricky123 VAD doesn't have an explicit destroy method
        // The pause() should stop it, and we'll let GC handle cleanup
      } catch (error) {
        console.error('Error cleaning up VAD:', error);
      }
      this.micVAD = null;
    }
    
    // Ensure microphone is closed (stopListening already calls closeMicrophone, but double-check)
    this.closeMicrophone();
    
    // Reset state
    this.isInitialized = false;
    this.isListening = false;
    this.isPaused = false;
    
    console.log('Listening manager cleaned up');
  }
  
  /**
   * Get current listening state
   */
  getState() {
    return {
      isListening: this.isListening,
      isRecording: false, // ricky123 VAD handles recording internally
      isPaused: this.isPaused,
      isInitialized: this.isInitialized,
      mediaStream: this.mediaStream,
    };
  }
}

// Export singleton instance
export const listeningManager = new ListeningManager();
