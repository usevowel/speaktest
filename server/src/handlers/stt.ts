/**
 * STT API handler for Cloudflare Workers
 * Uses unified STT service (configurable via STT_PROVIDER constant)
 */

import type { Request } from '@cloudflare/workers-types';
import type { Env } from '../types';
import type { STTRequest } from '../../../shared/types';
import { speechToText, isSTTAvailable, getSTTProvider } from '../services/stt';
import { handleCORS, addCORSHeaders } from '../utils/cors';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleSTT(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request, env);
  }

  // POST /api/stt - Convert speech to text
  if (request.method === 'POST' && url.pathname === '/api/stt') {
    try {
      if (!isSTTAvailable(env)) {
        const provider = getSTTProvider();
        const providerName = provider === 'groq' ? 'Groq' : 'Deepgram';
        return addCORSHeaders(
          errorResponse(
            'STT service unavailable',
            `${providerName} credentials not configured`,
            503
          ),
          request,
          env
        );
      }

      // Parse FormData (Workers native support)
      const formData = await request.formData();
      const audioFileValue = formData.get('audio');
      const language = formData.get('language') as string;

      if (!audioFileValue) {
        return addCORSHeaders(
          errorResponse('Invalid request', 'Audio file is required', 400),
          request,
          env
        );
      }

      if (!language) {
        return addCORSHeaders(
          errorResponse('Invalid request', 'Language is required', 400),
          request,
          env
        );
      }

      // Check if it's a File (FormDataEntryValue can be string | File)
      // In Workers, file uploads come as File objects
      if (typeof audioFileValue === 'string') {
        return addCORSHeaders(
          errorResponse('Invalid request', 'Audio file must be a File object', 400),
          request,
          env
        );
      }

      // TypeScript now knows it's a File - use type assertion to help TypeScript
      const audioFile = audioFileValue as unknown as File;
      const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });

      const sttRequest: STTRequest = {
        audioData: audioBlob,
        language: language as any,
      };

      const transcription = await speechToText(sttRequest, env);

      return addCORSHeaders(
        jsonResponse(transcription),
        request,
        env
      );
    } catch (error) {
      console.error('STT error:', error);
      return addCORSHeaders(
        errorResponse(
          'Speech-to-text failed',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // GET /api/stt/status - Check STT service status
  if (request.method === 'GET' && url.pathname === '/api/stt/status') {
    const available = isSTTAvailable(env);
    const provider = getSTTProvider();

    return addCORSHeaders(
      jsonResponse(
        { available, provider },
        200,
        available
          ? `STT service is available (using ${provider})`
          : `STT service is not configured (${provider} credentials missing)`
      ),
      request,
      env
    );
  }

  return addCORSHeaders(
    errorResponse('Not Found', `Route ${url.pathname} not found`, 404),
    request,
    env
  );
}
