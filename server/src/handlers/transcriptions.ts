/**
 * Transcriptions API handler for Cloudflare Workers
 * Uses R2 to store transcriptions as JSON files
 */

import type { Request } from '@cloudflare/workers-types';
import type { R2Bucket } from '@cloudflare/workers-types';
import type { Env } from '../types';
import type { Transcription } from '../../../shared/types';
import { handleCORS, addCORSHeaders } from '../utils/cors';
import { jsonResponse, errorResponse } from '../utils/response';

/**
 * Get all transcriptions from R2
 */
async function getAllTranscriptions(bucket: R2Bucket): Promise<Transcription[]> {
  try {
    const objects = await bucket.list({ prefix: 'transcriptions/' });
    const transcriptions: Transcription[] = [];
    
    for (const obj of objects.objects) {
      try {
        const transcriptionObj = await bucket.get(obj.key);
        if (transcriptionObj) {
          const transcription = await transcriptionObj.json() as Transcription;
          // Convert timestamp string back to Date
          transcription.timestamp = new Date(transcription.timestamp);
          transcriptions.push(transcription);
        }
      } catch (error) {
        console.warn(`Failed to load transcription ${obj.key}:`, error);
      }
    }
    
    return transcriptions;
  } catch (error) {
    console.error('Error loading transcriptions from R2:', error);
    return [];
  }
}

/**
 * Save a transcription to R2
 */
async function saveTranscription(transcription: Transcription, bucket: R2Bucket): Promise<void> {
  const objectKey = `transcriptions/${transcription.id}.json`;
  await bucket.put(objectKey, JSON.stringify(transcription), {
    httpMetadata: {
      contentType: 'application/json',
    },
  });
}

/**
 * Delete a transcription from R2
 */
async function deleteTranscription(id: string, bucket: R2Bucket): Promise<boolean> {
  try {
    const objectKey = `transcriptions/${id}.json`;
    await bucket.delete(objectKey);
    return true;
  } catch (error) {
    console.error(`Failed to delete transcription ${id}:`, error);
    return false;
  }
}

export async function handleTranscriptions(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request, env);
  }

  // GET /api/transcriptions - Get all transcriptions with optional filtering and sorting
  if (request.method === 'GET' && url.pathname === '/api/transcriptions') {
    try {
      const {
        language,
        dateFrom,
        dateTo,
        searchText,
        sortField = 'timestamp',
        sortDirection = 'desc',
        limit = '100',
        offset = '0',
      } = Object.fromEntries(url.searchParams);

      let filteredTranscriptions = await getAllTranscriptions(env.STORAGE);

      // Apply filters
      if (language) {
        filteredTranscriptions = filteredTranscriptions.filter(t => t.language === language);
      }

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredTranscriptions = filteredTranscriptions.filter(t => new Date(t.timestamp) >= fromDate);
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        filteredTranscriptions = filteredTranscriptions.filter(t => new Date(t.timestamp) <= toDate);
      }

      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filteredTranscriptions = filteredTranscriptions.filter(t => 
          t.text.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filteredTranscriptions.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
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

        if (sortDirection === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });

      // Apply pagination
      const startIndex = parseInt(offset) || 0;
      const limitNum = parseInt(limit) || 100;
      const paginatedTranscriptions = filteredTranscriptions.slice(startIndex, startIndex + limitNum);

      return addCORSHeaders(
        jsonResponse({
          transcriptions: paginatedTranscriptions,
          total: filteredTranscriptions.length,
          offset: startIndex,
          limit: limitNum,
        }),
        request,
        env
      );
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to fetch transcriptions',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // POST /api/transcriptions - Add a new transcription
  if (request.method === 'POST' && url.pathname === '/api/transcriptions') {
    try {
      const body = await request.json() as Partial<Transcription>;
      const { text, language, confidence, duration } = body;

      if (!text || !language) {
        return addCORSHeaders(
          errorResponse('Invalid request', 'Text and language are required', 400),
          request,
          env
        );
      }

      const transcription: Transcription = {
        id: `transcription-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        language: language as any,
        timestamp: new Date(),
        confidence,
        duration,
      };

      await saveTranscription(transcription, env.STORAGE);

      return addCORSHeaders(
        jsonResponse(transcription, 201, 'Transcription added successfully'),
        request,
        env
      );
    } catch (error) {
      console.error('Error adding transcription:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to add transcription',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // DELETE /api/transcriptions/:id - Delete a transcription
  if (request.method === 'DELETE' && url.pathname.startsWith('/api/transcriptions/')) {
    try {
      const id = url.pathname.split('/').pop() || '';
      const deleted = await deleteTranscription(id, env.STORAGE);

      if (!deleted) {
        return addCORSHeaders(
          errorResponse('Transcription not found', `Transcription with ID "${id}" does not exist`, 404),
          request,
          env
        );
      }

      return addCORSHeaders(
        jsonResponse({ deleted: true }, 200, 'Transcription deleted successfully'),
        request,
        env
      );
    } catch (error) {
      console.error('Error deleting transcription:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to delete transcription',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // DELETE /api/transcriptions - Clear all transcriptions
  if (request.method === 'DELETE' && url.pathname === '/api/transcriptions') {
    try {
      const objects = await env.STORAGE.list({ prefix: 'transcriptions/' });
      const count = objects.objects.length;
      
      const deletePromises = objects.objects.map(obj => env.STORAGE.delete(obj.key));
      await Promise.all(deletePromises);

      return addCORSHeaders(
        jsonResponse({ deleted: count }, 200, `Cleared ${count} transcriptions`),
        request,
        env
      );
    } catch (error) {
      console.error('Error clearing transcriptions:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to clear transcriptions',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  return addCORSHeaders(
    errorResponse('Not Found', `Route ${url.pathname} not found`, 404),
    request,
    env
  );
}
