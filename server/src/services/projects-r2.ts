/**
 * Projects service using R2 for project and markdown file management
 */

import type { Project, MarkdownFile, Phrase } from '../../../shared/types';
import type { R2Bucket } from '@cloudflare/workers-types';

/**
 * Parse markdown content to extract phrases
 */
export function parseMarkdownPhrases(content: string): Phrase[] {
  const lines = content.split('\n');
  const phrases: Phrase[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines, HTML comments, and lines containing # anywhere (treat as comments)
    if (trimmedLine && !trimmedLine.startsWith('<!--') && !trimmedLine.includes('#')) {
      // Regular text line (skip code blocks and empty lines)
      if (!trimmedLine.startsWith('```')) {
        phrases.push({
          id: `${index}-text`,
          text: trimmedLine,
          lineNumber: index + 1,
          isHeading: false,
        });
      }
    }
  });

  return phrases;
}

/**
 * Get all projects (folders) from R2 storage
 */
export async function getProjects(bucket: R2Bucket): Promise<Project[]> {
  try {
    // List all objects with projects prefix
    const objects = await bucket.list({ prefix: 'projects/' });
    
    // Extract unique project IDs from object keys
    // Keys format: projects/{projectId}/{filePath}
    const projectIds = new Set<string>();
    
    for (const obj of objects.objects) {
      const parts = obj.key.replace('projects/', '').split('/');
      if (parts.length > 0 && parts[0]) {
        projectIds.add(parts[0]);
      }
    }
    
    // Build projects with their markdown files
    const projects: Project[] = [];
    
    for (const projectId of projectIds) {
      const markdownFiles = await getMarkdownFiles(projectId, bucket);
      
      projects.push({
        id: projectId,
        name: projectId,
        path: projectId,
        markdownFiles,
      });
    }
    
    return projects;
  } catch (error) {
    console.error('Error reading projects from R2:', error);
    return [];
  }
}

/**
 * Get a specific project by ID
 */
export async function getProject(projectId: string, bucket: R2Bucket): Promise<Project | null> {
  try {
    // List objects with the project prefix
    const objects = await bucket.list({
      prefix: `projects/${projectId}/`,
    });
    
    if (objects.objects.length === 0) {
      return null;
    }
    
    const markdownFiles = await getMarkdownFiles(projectId, bucket);
    
    return {
      id: projectId,
      name: projectId,
      path: projectId,
      markdownFiles,
    };
  } catch (error) {
    console.error(`Error reading project ${projectId} from R2:`, error);
    return null;
  }
}

/**
 * Get all markdown files in a project (metadata only, no content/parsing)
 */
export async function getMarkdownFiles(projectId: string, bucket: R2Bucket): Promise<MarkdownFile[]> {
  try {
    // List all objects with the project prefix
    const objects = await bucket.list({
      prefix: `projects/${projectId}/`,
    });
    
    const files: MarkdownFile[] = [];
    
    for (const obj of objects.objects) {
      // Check if it's a markdown file
      if (obj.key.endsWith('.md')) {
        const fileName = obj.key.split('/').pop() || obj.key;
        // Store path without projects/ prefix for API compatibility
        const pathWithoutPrefix = obj.key.replace('projects/', '');
        
        files.push({
          id: pathWithoutPrefix,
          name: fileName,
          path: pathWithoutPrefix,
          content: '', // Don't load content for file listing
          phrases: [], // Don't parse phrases for file listing
        });
      }
    }
    
    return files;
  } catch (error) {
    console.error(`Error reading markdown files from R2 for project ${projectId}:`, error);
    return [];
  }
}

/**
 * Get a specific markdown file
 */
export async function getMarkdownFile(filePath: string, bucket: R2Bucket): Promise<MarkdownFile | null> {
  try {
    // Ensure path starts with projects/ prefix
    const objectKey = filePath.startsWith('projects/') ? filePath : `projects/${filePath}`;
    const object = await bucket.get(objectKey);
    
    if (!object) {
      return null;
    }
    
    const content = await object.text();
    const phrases = parseMarkdownPhrases(content);
    
    const fileName = filePath.split('/').pop() || filePath;
    // Return path without projects/ prefix for API compatibility
    const pathWithoutPrefix = filePath.replace('projects/', '');
    
    return {
      id: pathWithoutPrefix,
      name: fileName,
      path: pathWithoutPrefix,
      content,
      phrases,
    };
  } catch (error) {
    console.error(`Error reading markdown file ${filePath} from R2:`, error);
    return null;
  }
}

/**
 * Create a new project directory
 */
export async function createProject(projectName: string, bucket: R2Bucket): Promise<Project> {
  try {
    // Create a sample markdown file
    const sampleContent = `# ${projectName}\n\nWelcome to your new project!\n\nThis is a sample phrase.\nAdd more phrases here.`;
    const sampleFilePath = `projects/${projectName}/sample.md`;
    
    // Store the sample file in R2
    await bucket.put(sampleFilePath, sampleContent, {
      httpMetadata: {
        contentType: 'text/markdown',
      },
    });
    
    return await getProject(projectName, bucket) as Project;
  } catch (error) {
    console.error(`Error creating project ${projectName} in R2:`, error);
    throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
