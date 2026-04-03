/**
 * Cloudflare Workers entry point for speaktest server
 */

import type { Env } from './types';
import { handleTranslation } from './handlers/translation';
import { handleTTS } from './handlers/tts';
import { handleSTT } from './handlers/stt';
import { handleProjects } from './handlers/projects';
import { handleTranscriptions } from './handlers/transcriptions';
import { handleMarkdown } from './handlers/markdown';
import { handleCORS, addCORSHeaders } from './utils/cors';
import { jsonResponse, errorResponse } from './utils/response';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Log incoming requests (only in development or for API routes)
    if (env.NODE_ENV === 'development' || url.pathname.startsWith('/api/')) {
      console.log(`🌐 [${request.method}] ${url.pathname}`);
      console.log('🌐 [env] Available bindings:', Object.keys(env).filter(key => key !== 'GROQ_API_KEY' && key !== 'DEEPGRAM_API_KEY'));
      console.log('🌐 [env] STORAGE exists:', !!env.STORAGE);
    }
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request, env);
    }

    // Health check endpoint
    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV || 'development',
      });
    }

    // API routes - handle before static assets
    if (url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname.startsWith('/api/translate')) {
          return await handleTranslation(request, env);
        }
        
        if (url.pathname.startsWith('/api/tts')) {
          return await handleTTS(request, env);
        }
        
        if (url.pathname.startsWith('/api/stt')) {
          return await handleSTT(request, env);
        }
        
        if (url.pathname.startsWith('/api/projects')) {
          return await handleProjects(request, env);
        }
        
        if (url.pathname.startsWith('/api/transcriptions')) {
          return await handleTranscriptions(request, env);
        }
        
        if (url.pathname.startsWith('/api/markdown')) {
          console.log('🌐 [index] Routing to handleMarkdown');
          console.log('🌐 [index] env.STORAGE check:', !!env.STORAGE);
          return await handleMarkdown(request, env);
        }
        
        // API 404 handler
        return addCORSHeaders(
          errorResponse('Not Found', `API route ${url.pathname} not found`, 404),
          request,
          env
        );
      } catch (error) {
        console.error('API error:', error);
        return addCORSHeaders(
          errorResponse(
            'Internal server error',
            env.NODE_ENV === 'development' && error instanceof Error ? error.message : 'Something went wrong',
            500
          ),
          request,
          env
        );
      }
    }

    // Serve static assets (client build)
    // Wrangler's ASSETS binding handles static file serving
    try {
      // Check if ASSETS binding is available (might not be in dev without build)
      if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') {
        return new Response(
          'Static assets not available. Please build the client first: bun run build:client',
          { 
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          }
        );
      }

      const assetResponse = await env.ASSETS.fetch(request);
      
      // If asset not found and it's a GET request, try serving index.html for SPA routing
      if (assetResponse.status === 404 && request.method === 'GET' && !url.pathname.includes('.')) {
        // Try to serve index.html for client-side routing
        const indexRequest = new Request(new URL('/index.html', request.url), request);
        const indexResponse = await env.ASSETS.fetch(indexRequest);
        
        if (indexResponse.status === 200) {
          return indexResponse;
        }
      }
      
      return assetResponse;
    } catch (error) {
      console.error('Static asset error:', error);
      // Fallback to helpful error message
      return new Response(
        'Static assets error. In development, run the client dev server separately or build the client first.',
        { 
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        }
      );
    }
  },
};
