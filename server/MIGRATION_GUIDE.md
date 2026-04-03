# Cloudflare Workers Migration Guide

This server has been migrated from Express.js to Cloudflare Workers. The Worker serves both the client build and API from a single deployment.

## Prerequisites

1. Install Wrangler CLI:
```bash
npm install -g wrangler
# or
bun add -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

## Setup R2 Buckets

Create the single R2 bucket (path-based organization):

```bash
# Production bucket
wrangler r2 bucket create speaktest

# Development bucket
wrangler r2 bucket create speaktest-dev
```

The bucket uses path-based organization:
- `translation-cache/` - Translation cache files
- `tts-cache/` - TTS audio cache files
- `projects/` - Project markdown files
- `transcriptions/` - Transcription records

## Set Secrets

Set the required API keys as secrets:

```bash
# Production secrets
wrangler secret put GROQ_API_KEY --env production
wrangler secret put DEEPGRAM_API_KEY --env production

# Development secrets
wrangler secret put GROQ_API_KEY --env development
wrangler secret put DEEPGRAM_API_KEY --env development
```

**Note**: Deepgram provides both Speech-to-Text (STT) and Text-to-Speech (TTS) services.
Groq provides a Whisper-based STT alternative.

## Development

### Option 1: Run Both Together (Recommended)
Run client dev server and Worker dev server together:

```bash
# From project root
bun run dev
```

This runs:
- Client dev server on port 8031 (Vite with hot reload)
- Worker dev server (serves API + built client assets if available)

### Option 2: Run Separately
Run client and server separately:

```bash
# Terminal 1: Client dev server
bun run dev:client

# Terminal 2: Worker dev server
bun run dev:server
```

**Note**: During development, the Worker dev server will serve static assets from `client-dist/` if it exists (from a previous build). For hot reload, use the Vite dev server directly.

## Building

Build both client and server:

```bash
# Build client (outputs to client-dist/)
bun run build:client

# Build server TypeScript
bun run build:server

# Or build both
bun run build
```

The client build outputs to `client-dist/` which is configured in `wrangler.toml` as the assets directory.

## Deployment

Deploy to production (builds client automatically):

```bash
# From project root
bun run deploy

# Or manually:
bun run build:client
cd server
wrangler deploy --env production
```

The deployment process:
1. Builds the client to `client-dist/`
2. Deploys the Worker with static assets bundled
3. Worker serves both client and API from a single deployment

## Domain Configuration

The production deployment is configured for `speaktest.vowel.to`. Make sure:

1. The domain is configured in Cloudflare DNS
2. The Workers route is set up in `wrangler.toml` (pattern: `speaktest.vowel.to/*`)
3. SSL/TLS is enabled for the domain

## Architecture

### Single Worker Deployment
- **One Worker** serves both:
  - Static client assets (HTML, JS, CSS, images, etc.) from `client-dist/`
  - API routes (`/api/*`)
- **Routing**: 
  - `/api/*` → API handlers
  - Everything else → Static assets (with SPA fallback to `index.html`)

### Build Process
1. **Client Build**: Vite builds React app to `client-dist/`
2. **Worker Deployment**: Wrangler bundles Worker code + `client-dist/` assets
3. **Single Deployment**: One Worker handles everything

## Migration Notes

### What Changed

- **Framework**: Express.js → Cloudflare Workers
- **Storage**: File system → R2 buckets
- **Caching**: Local files → R2 objects
- **Environment**: `.env` file → Wrangler secrets
- **Runtime**: Node.js → V8 isolates
- **Deployment**: Separate client/server → Single Worker with bundled assets

### API Compatibility

All API endpoints remain the same:
- `/api/projects`
- `/api/translate`
- `/api/tts`
- `/api/stt`
- `/api/transcriptions`
- `/api/markdown`

### Breaking Changes

- No file system access (projects stored in R2)
- Cache format changed (but transparent to API)
- Environment variables must be set via `wrangler secret put`
- Client build must be created before Worker deployment

## Troubleshooting

### R2 Bucket Not Found

If you get errors about missing buckets, make sure you've created them:
```bash
wrangler r2 bucket list
```

### Missing Secrets

If API calls fail, verify secrets are set:
```bash
wrangler secret list --env production
```

### Client Assets Not Found

If the client doesn't load:
1. Make sure you've built the client: `bun run build:client`
2. Check that `client-dist/` directory exists
3. Verify `wrangler.toml` has `assets = { directory = "../client-dist" }`

### Local Development Issues

For local development with R2, use:
```bash
wrangler dev --local
```

This uses Miniflare for local R2 simulation.

### Asset Size Limits

Workers have a 1MB limit for bundled assets (free tier). If your client build exceeds this:
- Consider code splitting
- Move large assets to R2 and serve via public URLs
- Use Cloudflare's CDN for static assets

## Old Express Server

The old Express server code is preserved in:
- `server/src/server.ts` (old entry point)
- `server/src/routes/` (old route handlers)
- `server/src/services/translation-cache.ts` (old cache implementation)

These files are not used by the Workers implementation but kept for reference.
