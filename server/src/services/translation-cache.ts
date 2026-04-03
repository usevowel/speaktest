/**
 * Translation Cache Service
 * Caches translation responses to avoid regenerating translations for the same text
 * Uses SHA-256 hashing to create unique cache keys based on request parameters
 * Stores translations on disk for persistence across server restarts
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { TranslationRequest, TranslationResponse } from '../../../shared/types';

// Get current file directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache directory path (server/translation-cache/)
const CACHE_DIR = join(__dirname, '../../translation-cache');

/**
 * In-memory index for fast lookups
 * Key: hash of TranslationRequest parameters
 * Value: metadata about cached translation
 */
interface CacheMetadata {
  hash: string;
  fileName: string;
  cachedAt: number;
}

const cacheIndex = new Map<string, CacheMetadata>();

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  size: 0,
};

/**
 * Initialize cache directory and load existing cache index
 */
async function initializeCache(): Promise<void> {
  try {
    // Create cache directory if it doesn't exist
    await fs.mkdir(CACHE_DIR, { recursive: true });
    
    // Load existing cache files into index
    const files = await fs.readdir(CACHE_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json') && !file.endsWith('.meta.json')) {
        try {
          // Extract hash from filename (format: {hash}.json)
          const hash = file.replace('.json', '');
          const translationPath = join(CACHE_DIR, file);
          
          // Verify translation file exists and is readable
          await fs.access(translationPath);
          const translationContent = await fs.readFile(translationPath, 'utf-8');
          JSON.parse(translationContent); // Validate JSON
          
          // Store metadata in index
          const metadata: CacheMetadata = {
            hash,
            fileName: file,
            cachedAt: Date.now(), // We don't store this, so use current time
          };
          
          cacheIndex.set(hash, metadata);
        } catch (error) {
          console.warn(`⚠️  Failed to load translation cache entry ${file}:`, error);
        }
      }
    }
    
    cacheStats.size = cacheIndex.size;
    console.log(`📦 Translation Cache initialized with ${cacheIndex.size} entries from ${CACHE_DIR}`);
  } catch (error) {
    console.error('❌ Failed to initialize translation cache:', error);
  }
}

// Initialize cache on module load
initializeCache().catch(console.error);

/**
 * Generate a unique cache key from translation request parameters
 * Uses SHA-256 hash of normalized request data
 * 
 * @param request - Translation request parameters
 * @returns SHA-256 hash string as cache key
 */
export function generateCacheKey(request: TranslationRequest): string {
  // Normalize the request to ensure consistent hashing
  const normalized = {
    text: request.text.trim(),
    sourceLanguage: request.sourceLanguage?.toLowerCase() || 'auto',
    targetLanguage: request.targetLanguage.toLowerCase(),
  };
  
  // Create a deterministic string representation
  const keyString = JSON.stringify(normalized);
  
  // Generate SHA-256 hash
  const hash = createHash('sha256')
    .update(keyString)
    .digest('hex');
  
  return hash;
}

/**
 * Get cached translation response if available
 * 
 * @param request - Translation request parameters
 * @returns Cached TranslationResponse or undefined if not found
 */
export async function getCachedTranslation(request: TranslationRequest): Promise<TranslationResponse | undefined> {
  const cacheKey = generateCacheKey(request);
  const metadata = cacheIndex.get(cacheKey);
  
  if (metadata) {
    try {
      // Read translation file from disk
      const translationPath = join(CACHE_DIR, metadata.fileName);
      const translationContent = await fs.readFile(translationPath, 'utf-8');
      const cachedResponse: TranslationResponse = JSON.parse(translationContent);
      
      cacheStats.hits++;
      console.log(`✅ Translation Cache HIT for key: ${cacheKey.substring(0, 16)}... (${cacheStats.hits} hits, ${cacheStats.misses} misses)`);
      
      return cachedResponse;
    } catch (error) {
      console.error(`❌ Failed to read cached translation file:`, error);
      // Remove invalid entry from index
      cacheIndex.delete(cacheKey);
      cacheStats.size = cacheIndex.size;
    }
  }
  
  cacheStats.misses++;
  return undefined;
}

/**
 * Store translation response in cache
 * 
 * @param request - Translation request parameters used to generate cache key
 * @param response - Translation response to cache
 */
export async function cacheTranslation(request: TranslationRequest, response: TranslationResponse): Promise<void> {
  const cacheKey = generateCacheKey(request);
  
  try {
    const fileName = `${cacheKey}.json`;
    
    // Write translation response to file (includes metadata in the response itself)
    const translationPath = join(CACHE_DIR, fileName);
    await fs.writeFile(translationPath, JSON.stringify(response, null, 2), 'utf-8');
    
    // Store metadata in index
    const metadata: CacheMetadata = {
      hash: cacheKey,
      fileName,
      cachedAt: Date.now(),
    };
    
    // Update in-memory index
    cacheIndex.set(cacheKey, metadata);
    cacheStats.size = cacheIndex.size;
    
    console.log(`💾 Translation Cached to disk: ${cacheKey.substring(0, 16)}... (cache size: ${cacheStats.size})`);
  } catch (error) {
    console.error(`❌ Failed to cache translation response:`, error);
  }
}

/**
 * Clear all cached translation responses
 */
export async function clearTranslationCache(): Promise<void> {
  const previousSize = cacheIndex.size;
  
  try {
    // Delete all files in cache directory
    const files = await fs.readdir(CACHE_DIR);
    
    for (const file of files) {
      const filePath = join(CACHE_DIR, file);
      await fs.unlink(filePath);
    }
    
    // Clear in-memory index
    cacheIndex.clear();
    cacheStats.size = 0;
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    
    console.log(`🗑️  Translation Cache cleared from disk (removed ${previousSize} entries)`);
  } catch (error) {
    console.error(`❌ Failed to clear translation cache:`, error);
  }
}

/**
 * Get cache statistics
 * 
 * @returns Current cache statistics
 */
export function getCacheStats(): CacheStats {
  return {
    ...cacheStats,
    size: cacheIndex.size,
  };
}

/**
 * Get cache hit rate as a percentage
 * 
 * @returns Hit rate percentage (0-100)
 */
export function getCacheHitRate(): number {
  const total = cacheStats.hits + cacheStats.misses;
  if (total === 0) return 0;
  return (cacheStats.hits / total) * 100;
}

/**
 * Remove a specific entry from the cache
 * 
 * @param request - Translation request parameters to identify cache entry
 * @returns true if entry was removed, false if not found
 */
export async function removeCachedTranslation(request: TranslationRequest): Promise<boolean> {
  const cacheKey = generateCacheKey(request);
  const metadata = cacheIndex.get(cacheKey);
  
  if (!metadata) {
    return false;
  }
  
  try {
    // Delete translation file
    const translationPath = join(CACHE_DIR, metadata.fileName);
    await fs.unlink(translationPath);
    
    // Remove from index
    cacheIndex.delete(cacheKey);
    cacheStats.size = cacheIndex.size;
    
    console.log(`🗑️  Translation Cache entry removed from disk: ${cacheKey.substring(0, 16)}...`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove cache entry:`, error);
    return false;
  }
}
