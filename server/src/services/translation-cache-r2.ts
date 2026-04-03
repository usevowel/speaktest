/**
 * Translation Cache Service using R2
 * Caches translation responses to avoid regenerating translations for the same text
 * Uses SHA-256 hashing to create unique cache keys based on request parameters
 * Stores translations in R2 bucket for persistence across deployments
 */

import type { TranslationRequest, TranslationResponse } from '../../../shared/types';
import type { R2Bucket } from '@cloudflare/workers-types';

/**
 * Generate a unique cache key from translation request parameters
 * Uses SHA-256 hash of normalized request data
 * 
 * @param request - Translation request parameters
 * @returns SHA-256 hash string as cache key
 */
export async function generateCacheKey(request: TranslationRequest): Promise<string> {
  // Normalize the request to ensure consistent hashing
  const normalized = {
    text: request.text.trim(),
    sourceLanguage: request.sourceLanguage?.toLowerCase() || 'auto',
    targetLanguage: request.targetLanguage.toLowerCase(),
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
 * Get cached translation response if available
 * 
 * @param request - Translation request parameters
 * @param bucket - R2 bucket instance
 * @returns Cached TranslationResponse or undefined if not found
 */
export async function getCachedTranslation(
  request: TranslationRequest,
  bucket: R2Bucket
): Promise<TranslationResponse | undefined> {
  const cacheKey = await generateCacheKey(request);
  const objectKey = `translation-cache/${cacheKey}.json`;
  
  try {
    const object = await bucket.get(objectKey);
    
    if (!object) {
      return undefined;
    }
    
    const cachedResponse: TranslationResponse = await object.json();
    
    console.log(`✅ Translation Cache HIT for key: ${cacheKey.substring(0, 16)}...`);
    
    return cachedResponse;
  } catch (error) {
    console.error(`❌ Failed to read cached translation from R2:`, error);
    return undefined;
  }
}

/**
 * Store translation response in cache
 * 
 * @param request - Translation request parameters used to generate cache key
 * @param response - Translation response to cache
 * @param bucket - R2 bucket instance
 */
export async function cacheTranslation(
  request: TranslationRequest,
  response: TranslationResponse,
  bucket: R2Bucket
): Promise<void> {
  const cacheKey = await generateCacheKey(request);
  const objectKey = `translation-cache/${cacheKey}.json`;
  
  try {
    // Store translation response as JSON in R2
    await bucket.put(objectKey, JSON.stringify(response, null, 2), {
      httpMetadata: {
        contentType: 'application/json',
      },
    });
    
    console.log(`💾 Translation Cached to R2: ${cacheKey.substring(0, 16)}...`);
  } catch (error) {
    console.error(`❌ Failed to cache translation response to R2:`, error);
  }
}

/**
 * Clear all cached translation responses
 * 
 * @param bucket - R2 bucket instance
 */
export async function clearTranslationCache(bucket: R2Bucket): Promise<void> {
  try {
    // List all objects with translation-cache prefix
    const objects = await bucket.list({ prefix: 'translation-cache/' });
    
    // Delete all objects
    const deletePromises = objects.objects.map(obj => bucket.delete(obj.key));
    await Promise.all(deletePromises);
    
    console.log(`🗑️  Translation Cache cleared from R2 (removed ${objects.objects.length} entries)`);
  } catch (error) {
    console.error(`❌ Failed to clear translation cache from R2:`, error);
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
    const objects = await bucket.list({ prefix: 'translation-cache/' });
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
 * @param request - Translation request parameters to identify cache entry
 * @param bucket - R2 bucket instance
 * @returns true if entry was removed, false if not found
 */
export async function removeCachedTranslation(
  request: TranslationRequest,
  bucket: R2Bucket
): Promise<boolean> {
  const cacheKey = await generateCacheKey(request);
  const objectKey = `translation-cache/${cacheKey}.json`;
  
  try {
    await bucket.delete(objectKey);
    console.log(`🗑️  Translation Cache entry removed from R2: ${cacheKey.substring(0, 16)}...`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove cache entry from R2:`, error);
    return false;
  }
}
