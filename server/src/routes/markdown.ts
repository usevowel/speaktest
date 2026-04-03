/**
 * API routes for serving markdown files
 */

import express, { Request, Response } from 'express';
import { promises as fs } from 'fs';
import { join, resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

// Get project root directory - use PROJECTS_DIR env var if set, otherwise default to workspace root (3 levels up)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_PROJECT_ROOT = resolve(__dirname, '..', '..', '..');
const PROJECT_ROOT = process.env.PROJECTS_DIR 
  ? resolve(process.env.PROJECTS_DIR) 
  : DEFAULT_PROJECT_ROOT;

/**
 * GET /api/markdown/sample-project - List all markdown files in sample-project directory
 */
router.get('/sample-project', async (req: Request, res: Response) => {
  try {
    const sampleProjectPath = resolve(PROJECT_ROOT, 'sample-project');
    
    // Check if directory exists
    try {
      const stats = await fs.stat(sampleProjectPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({
          success: false,
          error: 'sample-project is not a directory'
        });
      }
    } catch (err) {
      return res.status(404).json({
        success: false,
        error: 'sample-project directory not found'
      });
    }
    
    // Read directory and filter markdown files
    const entries = await fs.readdir(sampleProjectPath, { withFileTypes: true });
    const markdownFiles = entries
      .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map(entry => ({
        name: entry.name,
        path: `sample-project/${entry.name}`
      }));
    
    res.json({
      success: true,
      data: markdownFiles
    });
  } catch (err) {
    console.error('Error listing sample-project files:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to list markdown files',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/markdown
 * Serves markdown files from the project directory
 * 
 * Query params:
 * - path: relative path to the markdown file from project root
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const requestedPath = req.query.path as string;
    
    if (!requestedPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing path parameter'
      });
    }
    
    // Resolve the absolute path
    const absolutePath = resolve(PROJECT_ROOT, requestedPath);
    
    // Security check: ensure the resolved path is within the project root
    const relativePath = relative(PROJECT_ROOT, absolutePath);
    if (relativePath.startsWith('..') || resolve(absolutePath) !== absolutePath) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: path outside project directory'
      });
    }
    
    // Check if file exists and is a file (not a directory)
    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        return res.status(400).json({
          success: false,
          error: 'Path is not a file'
        });
      }
    } catch (err) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    // Read and return the file content
    const content = await fs.readFile(absolutePath, 'utf-8');
    
    // Set appropriate headers for markdown
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(content);
    
  } catch (err) {
    console.error('Error serving markdown file:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to read markdown file',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

export { router as markdownRoutes };
