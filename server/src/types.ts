/**
 * Cloudflare Workers environment type definitions
 */

export interface Env {
  // Single R2 Bucket for all storage (path-based organization)
  STORAGE: R2Bucket;

  // Static assets binding (provided by Wrangler when assets are configured)
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };

  // Environment variables
  NODE_ENV: string;
  CLIENT_URL?: string;

  // Secrets (set via wrangler secret put)
  GROQ_API_KEY?: string;
  DEEPGRAM_API_KEY?: string;
  FISH_AUDIO_API_TOKEN?: string;
  FISH_AUDIO_TTS_MODEL?: string;
  FISH_AUDIO_TTS_LATENCY?: string;
}
