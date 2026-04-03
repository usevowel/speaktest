/**
 * Unified STT service for Express server (Node.js)
 * This file uses process.env and is NOT compatible with Cloudflare Workers
 * For Workers, use stt.ts instead
 */

import type { STTRequest, STTResponse } from '../../../shared/types';
import type { Env } from '../types';
import { speechToText as groqSTT, isGroqSTTAvailable } from './groq-stt';
import { speechToText as deepgramSTT, isDeepgramSTTAvailable } from './deepgram';

/**
 * STT Provider Configuration
 * Set to 'groq' to use Groq Whisper, or 'deepgram' to use Deepgram
 * Must match the value in stt.ts
 */
const STT_PROVIDER: 'groq' | 'deepgram' = 'deepgram';

/**
 * Convert speech to text using the configured provider (Express server version)
 * Uses process.env for environment variables (Node.js only)
 */
export async function speechToTextExpress(
  request: STTRequest
): Promise<STTResponse> {
  if (STT_PROVIDER === 'groq') {
    // For Express, create a mock env object from process.env
    const mockEnv = {
      GROQ_API_KEY: process.env.GROQ_API_KEY,
    } as Env;

    if (!isGroqSTTAvailable(mockEnv)) {
      throw new Error('Groq API key not configured. Please set GROQ_API_KEY environment variable.');
    }
    return groqSTT(request, mockEnv);
  } else {
    if (!isDeepgramSTTAvailable()) {
      throw new Error('Deepgram API key not configured. Please set DEEPGRAM_API_KEY environment variable.');
    }
    return deepgramSTT(request);
  }
}

/**
 * Check if STT service is available for the configured provider (Express server version)
 * Uses process.env for environment variables (Node.js only)
 */
export function isSTTAvailableExpress(): boolean {
  if (STT_PROVIDER === 'groq') {
    const mockEnv = {
      GROQ_API_KEY: process.env.GROQ_API_KEY,
    } as Env;
    return isGroqSTTAvailable(mockEnv);
  } else {
    return isDeepgramSTTAvailable();
  }
}

/**
 * Get the name of the currently configured STT provider
 */
export function getSTTProvider(): string {
  return STT_PROVIDER;
}
