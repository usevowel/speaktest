/**
 * Fish Audio text-to-speech service for Cloudflare Workers.
 *
 * The Fish API returns audio bytes directly.  The client API already expects a
 * data URL, so the Worker encodes the response before returning it.
 */

import type { TTSRequest, TTSResponse } from '../../../shared/types';
import type { Env } from '../types';
import { getCachedTTS, cacheTTS } from './tts-cache-r2';

const FISH_TTS_ENDPOINT = 'https://api.fish.audio/v1/tts';
const FISH_MODELS_ENDPOINT = 'https://api.fish.audio/model';
const DEFAULT_FISH_MODEL = 's2.1-pro-free';

type FishLatency = 'low' | 'normal' | 'balanced';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fishConfiguration(env: Env): { token: string; model: string; latency: FishLatency } | undefined {
  const token = env.FISH_AUDIO_API_TOKEN?.trim();
  if (!token) return undefined;

  const configuredLatency = env.FISH_AUDIO_TTS_LATENCY;
  const latency: FishLatency = configuredLatency === 'low' || configuredLatency === 'normal' || configuredLatency === 'balanced'
    ? configuredLatency
    : 'balanced';

  return {
    token,
    model: env.FISH_AUDIO_TTS_MODEL?.trim() || DEFAULT_FISH_MODEL,
    latency,
  };
}

/** A selected Fish catalog voice is represented as `fish:<model-id>`. */
function referenceId(voice?: string): string | undefined {
  return voice?.startsWith('fish:') ? voice.slice('fish:'.length) || undefined : undefined;
}

export function isFishTTSAvailable(env: Env): boolean {
  return fishConfiguration(env) !== undefined;
}

export async function textToSpeech(request: TTSRequest, env: Env): Promise<TTSResponse> {
  const configuration = fishConfiguration(env);
  if (!configuration) {
    throw new Error('Fish Audio API token not configured. Please set FISH_AUDIO_API_TOKEN.');
  }

  const cachedResponse = await getCachedTTS(request, env.STORAGE, 'fish-audio-v1');
  if (cachedResponse) return cachedResponse;

  const speed = typeof request.speed === 'number' && Number.isFinite(request.speed)
    ? Math.max(0.5, Math.min(2, request.speed))
    : 1;
  const selectedReferenceId = referenceId(request.voice);

  console.log('Fish Audio TTS:', {
    language: request.language,
    voice: selectedReferenceId ? 'catalog voice selected' : 'provider default',
    speed,
    model: configuration.model,
    latency: configuration.latency,
  });

  const response = await fetch(FISH_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${configuration.token}`,
      'Content-Type': 'application/json',
      model: configuration.model,
    },
    body: JSON.stringify({
      text: request.text.trim(),
      ...(selectedReferenceId ? { reference_id: selectedReferenceId } : {}),
      format: 'mp3',
      sample_rate: 44100,
      mp3_bitrate: 128,
      latency: configuration.latency,
      prosody: { speed, volume: 0, normalize_loudness: true },
      normalize: true,
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Fish Audio TTS failed (${response.status}): ${detail || response.statusText}`);
  }

  const audioUrl = `data:audio/mpeg;base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
  const ttsResponse: TTSResponse = { audioUrl };
  await cacheTTS(request, ttsResponse, env.STORAGE, 'fish-audio-v1');
  return ttsResponse;
}

/**
 * Return the first page of trained Fish voices.  The UI treats the `fish:`
 * prefix as a Fish model identifier; non-Fish legacy selections fall back to
 * the configured Fish default voice.
 */
export async function getSupportedVoices(env: Env): Promise<string[]> {
  const configuration = fishConfiguration(env);
  if (!configuration) return [];

  const url = new URL(FISH_MODELS_ENDPOINT);
  url.searchParams.set('page_size', '30');
  url.searchParams.set('page_number', '1');
  url.searchParams.set('sort_by', 'task_count');

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${configuration.token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Fish Audio voice catalog unavailable (${response.status})`);

  const body = await response.json() as { items?: unknown[] };
  return (body.items ?? []).flatMap((item): string[] => {
    if (!item || typeof item !== 'object') return [];
    const model = item as { _id?: unknown; type?: unknown; state?: unknown; dmca_taken_down?: unknown };
    return typeof model._id === 'string' && model.type === 'tts' && model.state === 'trained' && model.dmca_taken_down !== true
      ? [`fish:${model._id}`]
      : [];
  });
}
