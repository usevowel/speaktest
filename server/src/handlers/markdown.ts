/**
 * Markdown API handler for Cloudflare Workers
 */

import type { Request } from '@cloudflare/workers-types';
import type { Env } from '../types';
import { handleCORS, addCORSHeaders } from '../utils/cors';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleMarkdown(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request, env);
  }

  // GET /api/markdown/sample-project - List all markdown files in sample-project directory
  if (request.method === 'GET' && url.pathname === '/api/markdown/sample-project') {
    try {
      console.log('📄 [markdown] Handling /api/markdown/sample-project request');
      console.log('📄 [markdown] env keys:', Object.keys(env));
      console.log('📄 [markdown] env.STORAGE exists:', !!env.STORAGE);
      console.log('📄 [markdown] env.STORAGE type:', typeof env.STORAGE);
      
      // Check if STORAGE is available
      if (!env.STORAGE) {
        console.error('❌ [markdown] STORAGE bucket is not available');
        console.error('❌ [markdown] Available env keys:', Object.keys(env));
        return addCORSHeaders(
          errorResponse(
            'Storage not configured',
            'STORAGE R2 bucket is not available. Make sure buckets are created and wrangler dev is running with proper configuration.',
            503
          ),
          request,
          env
        );
      }

      console.log('📄 [markdown] Listing objects with prefix: projects/sample-project/');
      // List objects with projects/sample-project prefix
      const objects = await env.STORAGE.list({
        prefix: 'projects/sample-project/',
      });
      
      console.log('📄 [markdown] Found objects:', objects.objects.length);
      console.log('📄 [markdown] Object keys:', objects.objects.map(obj => obj.key));
      
      const markdownFiles = objects.objects
        .filter(obj => obj.key.toLowerCase().endsWith('.md'))
        .map(obj => ({
          name: obj.key.split('/').pop() || obj.key,
          path: obj.key.replace('projects/', '') // Remove projects/ prefix for API response
        }));
      
      return addCORSHeaders(
        jsonResponse(markdownFiles),
        request,
        env
      );
    } catch (error) {
      console.error('Error listing sample-project files:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to list markdown files',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // GET /api/markdown?path=... - Serve markdown file
  if (request.method === 'GET' && url.pathname === '/api/markdown') {
    try {
      // Check if STORAGE is available
      if (!env.STORAGE) {
        return addCORSHeaders(
          errorResponse(
            'Storage not configured',
            'STORAGE R2 bucket is not available. Make sure buckets are created and wrangler dev is running with proper configuration.',
            503
          ),
          request,
          env
        );
      }

      const requestedPath = url.searchParams.get('path');
      
      if (!requestedPath) {
        return addCORSHeaders(
          errorResponse('Missing path parameter', 'Path parameter is required', 400),
          request,
          env
        );
      }
      
      // Security check: ensure path doesn't contain dangerous patterns
      if (requestedPath.includes('..') || requestedPath.startsWith('/')) {
        return addCORSHeaders(
          errorResponse('Access denied', 'Path outside project directory', 403),
          request,
          env
        );
      }
      
      // Ensure path has projects/ prefix
      const objectKey = requestedPath.startsWith('projects/') ? requestedPath : `projects/${requestedPath}`;
      
      // Get file from R2
      const object = await env.STORAGE.get(objectKey);
      
      if (!object) {
        return addCORSHeaders(
          errorResponse('File not found', 'File not found', 404),
          request,
          env
        );
      }
      
      const content = await object.text();
      
      // Return as markdown
      return addCORSHeaders(
        new Response(content, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
          },
        }),
        request,
        env
      );
    } catch (error) {
      console.error('Error serving markdown file:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to read markdown file',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  return addCORSHeaders(
    errorResponse('Not Found', `Route ${url.pathname} not found`, 404),
    request,
    env
  );
}
