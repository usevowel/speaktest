/**
 * Unified STT service that routes to different providers
 * Configure which provider to use via STT_PROVIDER constant
 *
 * This file is Workers-compatible. For Express server, use stt-express.ts
 */

import type { STTRequest, STTResponse } from '../../../shared/types';
import type { Env } from '../types';
import { speechToText as groqSTT, isGroqSTTAvailable } from './groq-stt';
import { speechToText as deepgramSTT, isDeepgramSTTAvailable } from './deepgram-workers';

/**
 * STT Provider Configuration
 * Set to 'groq' to use Groq Whisper, or 'deepgram' to use Deepgram
 */
const STT_PROVIDER: 'groq' | 'deepgram' = 'deepgram';

/**
 * Convert speech to text using the configured provider
 * Works with Cloudflare Workers (requires env parameter)
 */
export async function speechToText(
  request: STTRequest,
  env: Env
): Promise<STTResponse> {
  if (STT_PROVIDER === 'groq') {
    if (!isGroqSTTAvailable(env)) {
      throw new Error('Groq API key not configured. Please set GROQ_API_KEY secret.');
    }
    return groqSTT(request, env);
  } else {
    if (!isDeepgramSTTAvailable(env)) {
      throw new Error('Deepgram API key not configured. Please set DEEPGRAM_API_KEY secret.');
    }
    return deepgramSTT(request, env);
  }
}

/**
 * Check if STT service is available for the configured provider
 * Works with Cloudflare Workers (requires env parameter)
 */
export function isSTTAvailable(env: Env): boolean {
  if (STT_PROVIDER === 'groq') {
    return isGroqSTTAvailable(env);
  } else {
    return isDeepgramSTTAvailable(env);
  }
}

/**
 * Get the name of the currently configured STT provider
 */
export function getSTTProvider(): string {
  return STT_PROVIDER;
}
