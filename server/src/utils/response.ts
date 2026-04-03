/**
 * Response utility functions for Cloudflare Workers
 */

import type { ApiResponse } from '../../../shared/types';

/**
 * Create a JSON API response
 */
export function jsonResponse<T>(
  data: T,
  status: number = 200,
  message?: string
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error JSON API response
 */
export function errorResponse(
  error: string,
  message: string,
  status: number = 500
): Response {
  const response: ApiResponse<never> = {
    success: false,
    error,
    message,
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
