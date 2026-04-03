/**
 * Projects API handler for Cloudflare Workers
 */

import type { Request } from '@cloudflare/workers-types';
import type { Env } from '../types';
import { getProjects, getProject, getMarkdownFile, createProject } from '../services/projects-r2';
import { handleCORS, addCORSHeaders } from '../utils/cors';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleProjects(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS(request, env);
  }

  // GET /api/projects - Get all projects
  if (request.method === 'GET' && url.pathname === '/api/projects') {
    try {
      const projects = await getProjects(env.STORAGE);
      
      return addCORSHeaders(
        jsonResponse(projects),
        request,
        env
      );
    } catch (error) {
      console.error('Error fetching projects:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to fetch projects',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // GET /api/projects/:id - Get a specific project
  if (request.method === 'GET' && url.pathname.startsWith('/api/projects/') && !url.pathname.includes('/files/')) {
    try {
      const projectId = url.pathname.split('/').pop() || '';
      const project = await getProject(projectId, env.STORAGE);
      
      if (!project) {
        return addCORSHeaders(
          errorResponse('Project not found', `Project with ID "${projectId}" does not exist`, 404),
          request,
          env
        );
      }
      
      return addCORSHeaders(
        jsonResponse(project),
        request,
        env
      );
    } catch (error) {
      console.error('Error fetching project:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to fetch project',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // GET /api/projects/:id/files/* - Get a specific markdown file
  if (request.method === 'GET' && url.pathname.includes('/api/projects/') && url.pathname.includes('/files/')) {
    try {
      const pathParts = url.pathname.split('/api/projects/')[1];
      if (!pathParts) {
        return addCORSHeaders(
          errorResponse('Invalid request', 'Invalid file path', 400),
          request,
          env
        );
      }
      
      // Remove leading project ID and /files/ prefix
      const filePath = pathParts.replace(/^[^/]+\/files\//, '');
      const projectId = pathParts.split('/')[0];
      const fullFilePath = `${projectId}/${filePath}`;
      
      const file = await getMarkdownFile(fullFilePath, env.STORAGE);
      
      if (!file) {
        return addCORSHeaders(
          errorResponse('File not found', `File "${filePath}" not found in project "${projectId}"`, 404),
          request,
          env
        );
      }
      
      return addCORSHeaders(
        jsonResponse(file),
        request,
        env
      );
    } catch (error) {
      console.error('Error fetching file:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to fetch file',
          error instanceof Error ? error.message : 'Unknown error',
          500
        ),
        request,
        env
      );
    }
  }

  // POST /api/projects - Create a new project
  if (request.method === 'POST' && url.pathname === '/api/projects') {
    try {
      const body = await request.json() as { name: string };
      const { name } = body;
      
      if (!name || typeof name !== 'string') {
        return addCORSHeaders(
          errorResponse('Invalid project name', 'Project name is required and must be a string', 400),
          request,
          env
        );
      }
      
      const project = await createProject(name, env.STORAGE);
      
      return addCORSHeaders(
        jsonResponse(project, 201, 'Project created successfully'),
        request,
        env
      );
    } catch (error) {
      console.error('Error creating project:', error);
      return addCORSHeaders(
        errorResponse(
          'Failed to create project',
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
