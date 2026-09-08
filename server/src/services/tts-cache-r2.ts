/**
 * TTS Cache Service using R2
 * Caches TTS responses to avoid regenerating audio for the same text
 * Uses SHA-256 hashing to create unique cache keys based on request parameters
 * Stores audio files (as base64 data URLs) in R2 bucket for persistence across deployments
 */

import type { TTSRequest, TTSResponse } from '../../../shared/types';
import type { R2Bucket } from '@cloudflare/workers-types';

/**
 * Generate a unique cache key from TTS request parameters
 * Uses SHA-256 hash of normalized request data
 * 
 * @param request - TTS request parameters
 * @returns SHA-256 hash string as cache key
 */
export async function generateCacheKey(request: TTSRequest, provider = 'legacy'): Promise<string> {
  // Normalize the request to ensure consistent hashing
  const normalized = {
    text: request.text.trim(),
    language: request.language.toLowerCase(),
    voice: request.voice?.toLowerCase() || 'default',
    speed: request.speed || 1.0,
    provider,
  };
  
  // Create a deterministic string representation
  const keyString = JSON.stringify(normalized);
  
  // Generate SHA-256 hash using Web Crypto API
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hash;
}

/**
 * Get cached TTS response if available
 * 
 * @param request - TTS request parameters
 * @param bucket - R2 bucket instance
 * @returns Cached TTSResponse or undefined if not found
 */
export async function getCachedTTS(
  request: TTSRequest,
  bucket: R2Bucket,
  provider?: string,
): Promise<TTSResponse | undefined> {
  const cacheKey = await generateCacheKey(request, provider);
  const objectKey = `tts-cache/${cacheKey}.txt`;
  
  try {
    const object = await bucket.get(objectKey);
    
    if (!object) {
      return undefined;
    }
    
    // Read audio data URL from R2
    const audioUrl = await object.text();
    
    console.log(`✅ TTS Cache HIT for key: ${cacheKey.substring(0, 16)}...`);
    
    return {
      audioUrl,
      duration: undefined,
    };
  } catch (error) {
    console.error(`❌ Failed to read cached TTS from R2:`, error);
    return undefined;
  }
}

/**
 * Store TTS response in cache
 * 
 * @param request - TTS request parameters used to generate cache key
 * @param response - TTS response to cache
 * @param bucket - R2 bucket instance
 */
export async function cacheTTS(
  request: TTSRequest,
  response: TTSResponse,
  bucket: R2Bucket,
  provider?: string,
): Promise<void> {
  const cacheKey = await generateCacheKey(request, provider);
  const objectKey = `tts-cache/${cacheKey}.txt`;
  
  try {
    // Determine audio format from data URL
    const audioFormat = response.audioUrl.startsWith('data:audio/wav') ? 'wav' : 'mp3';
    
    // Store audio data URL as text in R2
    await bucket.put(objectKey, response.audioUrl, {
      httpMetadata: {
        contentType: 'text/plain',
      },
      customMetadata: {
        audioFormat,
        cachedAt: Date.now().toString(),
      },
    });
    
    console.log(`💾 TTS Cached to R2: ${cacheKey.substring(0, 16)}...`);
  } catch (error) {
    console.error(`❌ Failed to cache TTS response to R2:`, error);
  }
}

/**
 * Clear all cached TTS responses
 * 
 * @param bucket - R2 bucket instance
 */
export async function clearTTSCache(bucket: R2Bucket): Promise<void> {
  try {
    // List all objects with tts-cache prefix
    const objects = await bucket.list({ prefix: 'tts-cache/' });
    
    // Delete all objects
    const deletePromises = objects.objects.map(obj => bucket.delete(obj.key));
    await Promise.all(deletePromises);
    
    console.log(`🗑️  TTS Cache cleared from R2 (removed ${objects.objects.length} entries)`);
  } catch (error) {
    console.error(`❌ Failed to clear TTS cache from R2:`, error);
  }
}

/**
 * Get cache statistics
 * 
 * @param bucket - R2 bucket instance
 * @returns Cache statistics
 */
export async function getCacheStats(bucket: R2Bucket): Promise<{
  size: number;
}> {
  try {
    const objects = await bucket.list({ prefix: 'tts-cache/' });
    return {
      size: objects.objects.length,
    };
  } catch (error) {
    console.error(`❌ Failed to get cache stats from R2:`, error);
    return { size: 0 };
  }
}

/**
 * Remove a specific entry from the cache
 * 
 * @param request - TTS request parameters to identify cache entry
 * @param bucket - R2 bucket instance
 * @returns true if entry was removed, false if not found
 */
export async function removeCachedTTS(
  request: TTSRequest,
  bucket: R2Bucket
): Promise<boolean> {
  const cacheKey = await generateCacheKey(request);
  const objectKey = `tts-cache/${cacheKey}.txt`;
  
  try {
    await bucket.delete(objectKey);
    console.log(`🗑️  TTS Cache entry removed from R2: ${cacheKey.substring(0, 16)}...`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove cache entry from R2:`, error);
    return false;
  }
}
