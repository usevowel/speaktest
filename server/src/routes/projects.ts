/**
 * Project management API routes
 */

import { Router } from 'express';
import type { ApiResponse, Project, MarkdownFile } from '../../../shared/types';
import { getProjects, getProject, getMarkdownFile, createProject } from '../services/fileSystem';

const router = Router();

/**
 * GET /api/projects - Get all projects
 */
router.get('/', async (req, res) => {
  try {
    const projects = await getProjects();
    
    const response: ApiResponse<Project[]> = {
      success: true,
      data: projects,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching projects:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch projects',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/projects/:id - Get a specific project
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await getProject(id);
    
    if (!project) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Project not found',
        message: `Project with ID "${id}" does not exist`,
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching project:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch project',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/projects/:id/files/:filePath - Get a specific markdown file
 */
router.get('/:id/files/*', async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = req.params[0]; // Get the rest of the path
    
    // Construct full file path
    const fullFilePath = `${id}/${filePath}`;
    
    const file = await getMarkdownFile(fullFilePath);
    
    if (!file) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'File not found',
        message: `File "${filePath}" not found in project "${id}"`,
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<MarkdownFile> = {
      success: true,
      data: file,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching file:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch file',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    
    res.status(500).json(response);
  }
});

/**
 * POST /api/projects - Create a new project
 */
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string') {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid project name',
        message: 'Project name is required and must be a string',
      };
      
      return res.status(400).json(response);
    }
    
    const project = await createProject(name);
    
    const response: ApiResponse<Project> = {
      success: true,
      data: project,
      message: 'Project created successfully',
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating project:', error);
    
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to create project',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    
    res.status(500).json(response);
  }
});

export { router as projectRoutes };
