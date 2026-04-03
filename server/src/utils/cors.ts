/**
 * CORS utility functions for Cloudflare Workers
 */

import type { Env } from '../types';

/**
 * Handle CORS preflight requests
 */
export function handleCORS(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || env.CLIENT_URL || '*';
  
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Add CORS headers to a response
 */
export function addCORSHeaders(response: Response, request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || env.CLIENT_URL || '*';
  
  // Clone the response to add headers
  const newResponse = new Response(response.body, response);
  
  newResponse.headers.set('Access-Control-Allow-Origin', origin);
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return newResponse;
}
