/**
 * Client-side cache for TTS voices by language
 * Caches voices API responses to avoid repeated requests
 */

interface VoicesCacheEntry {
  voices: string[];
  timestamp: number;
}

const voicesCache = new Map<string, VoicesCacheEntry>();
const VOICES_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Get cached voices for a language
 */
export function getCachedVoices(language: string): string[] | null {
  const cached = voicesCache.get(language);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < VOICES_CACHE_TTL) {
    console.log(`✅ Voices cache HIT for language: ${language}`);
    return cached.voices;
  }
  
  return null;
}

/**
 * Cache voices for a language
 */
export function cacheVoices(language: string, voices: string[]): void {
  voicesCache.set(language, {
    voices,
    timestamp: Date.now(),
  });
  console.log(`💾 Voices cached for language: ${language} (${voices.length} voices)`);
}

/**
 * Clear voices cache
 */
export function clearVoicesCache(): void {
  voicesCache.clear();
  console.log('🗑️  Voices cache cleared');
}

/**
 * Check if a voice is valid for a language
 */
export function isValidVoice(language: string, voice: string): boolean {
  const cached = getCachedVoices(language);
  if (cached) {
    return cached.includes(voice);
  }
  // If not cached, assume valid (will be validated on server)
  return true;
}
