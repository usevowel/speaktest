/**
 * TTS Cache Service
 * Caches TTS responses to avoid regenerating audio for the same text
 * Uses SHA-256 hashing to create unique cache keys based on request parameters
 * Stores audio files on disk for persistence across server restarts
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { TTSRequest, TTSResponse } from '../../../shared/types';

// Get current file directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache directory path (server/tts-cache/)
const CACHE_DIR = join(__dirname, '../../tts-cache');

/**
 * In-memory index for fast lookups
 * Key: hash of TTSRequest parameters
 * Value: metadata about cached file
 */
interface CacheMetadata {
  hash: string;
  fileName: string;
  audioFormat: string;
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
      if (file.endsWith('.json')) {
        try {
          const metadataPath = join(CACHE_DIR, file);
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata: CacheMetadata = JSON.parse(metadataContent);
          
          // Verify audio file exists
          const audioPath = join(CACHE_DIR, metadata.fileName);
          await fs.access(audioPath);
          
          cacheIndex.set(metadata.hash, metadata);
        } catch (error) {
          console.warn(`⚠️  Failed to load cache entry ${file}:`, error);
        }
      }
    }
    
    cacheStats.size = cacheIndex.size;
    console.log(`📦 TTS Cache initialized with ${cacheIndex.size} entries from ${CACHE_DIR}`);
  } catch (error) {
    console.error('❌ Failed to initialize TTS cache:', error);
  }
}

// Initialize cache on module load
initializeCache().catch(console.error);

/**
 * Generate a unique cache key from TTS request parameters
 * Uses SHA-256 hash of normalized request data
 * 
 * @param request - TTS request parameters
 * @returns SHA-256 hash string as cache key
 */
export function generateCacheKey(request: TTSRequest): string {
  // Normalize the request to ensure consistent hashing
  const normalized = {
    text: request.text.trim(),
    language: request.language.toLowerCase(),
    voice: request.voice?.toLowerCase() || 'default',
    speed: request.speed || 1.0,
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
 * Get cached TTS response if available
 * 
 * @param request - TTS request parameters
 * @returns Cached TTSResponse or undefined if not found
 */
export async function getCachedTTS(request: TTSRequest): Promise<TTSResponse | undefined> {
  const cacheKey = generateCacheKey(request);
  const metadata = cacheIndex.get(cacheKey);
  
  if (metadata) {
    try {
      // Read audio file from disk
      const audioPath = join(CACHE_DIR, metadata.fileName);
      const audioData = await fs.readFile(audioPath, 'utf-8');
      
      cacheStats.hits++;
      console.log(`✅ TTS Cache HIT for key: ${cacheKey.substring(0, 16)}... (${cacheStats.hits} hits, ${cacheStats.misses} misses)`);
      
      return {
        audioUrl: audioData,
        duration: undefined,
      };
    } catch (error) {
      console.error(`❌ Failed to read cached audio file:`, error);
      // Remove invalid entry from index
      cacheIndex.delete(cacheKey);
      cacheStats.size = cacheIndex.size;
    }
  }
  
  cacheStats.misses++;
  console.log(`❌ TTS Cache MISS for key: ${cacheKey.substring(0, 16)}... (${cacheStats.hits} hits, ${cacheStats.misses} misses)`);
  return undefined;
}

/**
 * Store TTS response in cache
 * 
 * @param request - TTS request parameters used to generate cache key
 * @param response - TTS response to cache
 */
export async function cacheTTS(request: TTSRequest, response: TTSResponse): Promise<void> {
  const cacheKey = generateCacheKey(request);
  
  try {
    // Determine audio format from data URL
    const audioFormat = response.audioUrl.startsWith('data:audio/wav') ? 'wav' : 'mp3';
    const fileName = `${cacheKey}.txt`; // Store as text file containing data URL
    const metadataFileName = `${cacheKey}.json`;
    
    // Write audio data to file
    const audioPath = join(CACHE_DIR, fileName);
    await fs.writeFile(audioPath, response.audioUrl, 'utf-8');
    
    // Write metadata
    const metadata: CacheMetadata = {
      hash: cacheKey,
      fileName,
      audioFormat,
      cachedAt: Date.now(),
    };
    
    const metadataPath = join(CACHE_DIR, metadataFileName);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    
    // Update in-memory index
    cacheIndex.set(cacheKey, metadata);
    cacheStats.size = cacheIndex.size;
    
    console.log(`💾 TTS Cached to disk: ${cacheKey.substring(0, 16)}... (cache size: ${cacheStats.size})`);
  } catch (error) {
    console.error(`❌ Failed to cache TTS response:`, error);
  }
}

/**
 * Clear all cached TTS responses
 */
export async function clearTTSCache(): Promise<void> {
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
    
    console.log(`🗑️  TTS Cache cleared from disk (removed ${previousSize} entries)`);
  } catch (error) {
    console.error(`❌ Failed to clear TTS cache:`, error);
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
 * @param request - TTS request parameters to identify cache entry
 * @returns true if entry was removed, false if not found
 */
export async function removeCachedTTS(request: TTSRequest): Promise<boolean> {
  const cacheKey = generateCacheKey(request);
  const metadata = cacheIndex.get(cacheKey);
  
  if (!metadata) {
    return false;
  }
  
  try {
    // Delete audio file
    const audioPath = join(CACHE_DIR, metadata.fileName);
    await fs.unlink(audioPath);
    
    // Delete metadata file
    const metadataPath = join(CACHE_DIR, `${cacheKey}.json`);
    await fs.unlink(metadataPath);
    
    // Remove from index
    cacheIndex.delete(cacheKey);
    cacheStats.size = cacheIndex.size;
    
    console.log(`🗑️  TTS Cache entry removed from disk: ${cacheKey.substring(0, 16)}...`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to remove cache entry:`, error);
    return false;
  }
}

