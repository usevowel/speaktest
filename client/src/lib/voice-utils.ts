/**
 * Voice utility functions for parsing and filtering provider voice IDs.
 */

/**
 * Parses a voice ID to extract the display name
 * Deepgram voice format: aura-2-{name}-{language} or aura-{name}-{language} (legacy)
 * Examples:
 *   - aura-2-gloria-es → Gloria
 *   - aura-2-thalia-en → Thalia
 *   - aura-asteria-en → Asteria (legacy)
 *
 * @param voiceId - The full voice ID from Deepgram
 * @returns The formatted voice name for display
 */
export function parseVoiceName(voiceId: string): string {
  if (!voiceId || typeof voiceId !== 'string') {
    return 'Unknown';
  }

  // Match pattern: aura-2-name-lang or aura-name-lang
  // Captures the name part (third segment in aura-2, second in legacy aura)
  const match = voiceId.match(/^aura(?:-2)?-([a-z]+)-[a-z]{2}$/);

  if (match && match[1]) {
    // Capitalize first letter of the name
    const name = match[1];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  if (voiceId.startsWith('fish:')) {
    return 'Fish voice';
  }

  // Fallback: if pattern doesn't match, return the original
  return voiceId;
}

/**
 * Extracts the language code from a voice ID
 * Examples:
 *   - aura-2-gloria-es → es
 *   - aura-2-thalia-en → en
 *
 * @param voiceId - The full voice ID from Deepgram
 * @returns The 2-letter language code or null if not found
 */
export function extractVoiceLanguage(voiceId: string): string | null {
  if (!voiceId || typeof voiceId !== 'string') {
    return null;
  }

  const match = voiceId.match(/^aura(?:-2)?-[a-z]+-([a-z]{2})$/);
  return match ? match[1] : null;
}

/** Whether a voice ID is a Fish Audio catalog model. */
export function isFishVoice(voiceId: string | undefined): boolean {
  return Boolean(voiceId?.startsWith('fish:'));
}

/**
 * Maps TTS language codes to voice language codes
 * Used for filtering voices by the selected target language
 */
const LANGUAGE_CODE_MAP: Record<string, string> = {
  // English variants all map to 'en' voice code
  'en-us': 'en',
  'en-gb': 'en',
  'en-au': 'en',
  'en-ie': 'en',
  'en-ph': 'en',
  // Spanish variants all map to 'es' voice code
  'es': 'es',
  'es-mx': 'es',
  'es-es': 'es',
  'es-co': 'es',
  'es-419': 'es',
  // Other languages map directly
  'de': 'de',
  'fr': 'fr',
  'it': 'it',
  'ja': 'ja',
  'nl': 'nl',
};

/**
 * Filters voices by the selected language
 * Deepgram voices work across language variants (e.g., 'en' voices work for en-us, en-gb, etc.)
 *
 * @param voices - Array of voice IDs
 * @param language - The target language code (e.g., 'de', 'es-mx', 'en-us')
 * @returns Filtered array of voice IDs that support the language
 */
export function filterVoicesByLanguage(voices: string[], language: string): string[] {
  if (!voices || !Array.isArray(voices) || voices.length === 0) {
    return [];
  }

  const targetLangCode = LANGUAGE_CODE_MAP[language.toLowerCase()];

  if (!targetLangCode) {
    // If no mapping found, return all voices as fallback
    return voices;
  }

  const languageVoices = voices.filter(voiceId => {
    const voiceLangCode = extractVoiceLanguage(voiceId);
    // Match voice language code to target language code
    return voiceLangCode === targetLangCode;
  });

  // Fish catalog models do not carry a language suffix. Keep them selectable
  // for every target language rather than showing an empty voice menu.
  return languageVoices.length > 0 ? languageVoices : voices.filter(isFishVoice);
}

/**
 * Gets a display label for a voice including the parsed name
 * Optionally includes gender/accent info if available in comments
 *
 * @param voiceId - The full voice ID
 * @returns Formatted display label
 */
export function getVoiceDisplayLabel(voiceId: string): string {
  const name = parseVoiceName(voiceId);
  const langCode = extractVoiceLanguage(voiceId);

  if (!langCode) {
    return name;
  }

  // Check if it's a legacy aura-1 voice
  const isLegacy = voiceId.startsWith('aura-') && !voiceId.startsWith('aura-2-');

  if (isLegacy) {
    return `${name} (Legacy)`;
  }

  return name;
}
