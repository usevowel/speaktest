/**
 * File system service for project and markdown file management
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, extname, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { Project, MarkdownFile, MarkdownFileMeta, Phrase } from '../../../shared/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Use PROJECTS_DIR environment variable if set, otherwise default to workspace root (3 levels up)
const DEFAULT_PROJECT_ROOT = join(__dirname, '..', '..', '..');
const PROJECT_ROOT = process.env.PROJECTS_DIR 
  ? resolve(process.env.PROJECTS_DIR) 
  : DEFAULT_PROJECT_ROOT;

// Log the projects directory being used
console.log(`📁 Projects directory: ${PROJECT_ROOT}${process.env.PROJECTS_DIR ? ` (from PROJECTS_DIR env var)` : ' (default: workspace root)'}`);

/**
 * Get all projects (folders) in the root directory
 */
export async function getProjects(): Promise<Project[]> {
  try {
    const entries = await fs.readdir(PROJECT_ROOT, { withFileTypes: true });
    const projects: Project[] = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        const projectPath = join(PROJECT_ROOT, entry.name);
        const markdownFiles = await getMarkdownFiles(projectPath);
        
        projects.push({
          id: entry.name,
          name: entry.name,
          path: projectPath,
          markdownFiles,
        });
      }
    }

    return projects;
  } catch (error) {
    console.error('Error reading projects:', error);
    return [];
  }
}

/**
 * Get a specific project by ID
 */
export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const projectPath = join(PROJECT_ROOT, projectId);
    const stats = await fs.stat(projectPath);
    
    if (!stats.isDirectory()) {
      return null;
    }

    const markdownFiles = await getMarkdownFiles(projectPath);
    
    return {
      id: projectId,
      name: projectId,
      path: projectPath,
      markdownFiles,
    };
  } catch (error) {
    console.error(`Error reading project ${projectId}:`, error);
    return null;
  }
}

/**
 * Get all markdown files in a directory (recursive) - metadata only, no content/parsing
 */
export async function getMarkdownFiles(dirPath: string): Promise<MarkdownFile[]> {
  try {
    const files: MarkdownFile[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        // Recursively scan subdirectories
        const subFiles = await getMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
        files.push({
          id: fullPath,
          name: entry.name,
          path: fullPath,
          content: '', // Don't load content for file listing
          phrases: [], // Don't parse phrases for file listing
        });
      }
    }

    return files;
  } catch (error) {
    console.error(`Error reading markdown files from ${dirPath}:`, error);
    return [];
  }
}

/**
 * Get a specific markdown file
 */
export async function getMarkdownFile(filePath: string): Promise<MarkdownFile | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const phrases = parseMarkdownPhrases(content);
    
    return {
      id: filePath,
      name: basename(filePath),
      path: filePath,
      content,
      phrases,
    };
  } catch (error) {
    console.error(`Error reading markdown file ${filePath}:`, error);
    return null;
  }
}

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
 * Create a new project directory
 */
export async function createProject(projectName: string): Promise<Project> {
  try {
    const projectPath = join(PROJECT_ROOT, projectName);
    await fs.mkdir(projectPath, { recursive: true });
    
    // Create a sample markdown file
    const sampleContent = `# ${projectName}\n\nWelcome to your new project!\n\nThis is a sample phrase.\nAdd more phrases here.`;
    const sampleFilePath = join(projectPath, 'sample.md');
    await fs.writeFile(sampleFilePath, sampleContent);
    
    return await getProject(projectName) as Project;
  } catch (error) {
    console.error(`Error creating project ${projectName}:`, error);
    throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Watch for file changes in a project directory
 */
export function watchProject(projectPath: string, callback: (event: string, filename: string) => void): () => void {
  try {
    const watcher = fs.watch(projectPath, { recursive: true }, callback);
    return () => watcher.close();
  } catch (error) {
    console.error(`Error watching project ${projectPath}:`, error);
    return () => {}; // No-op cleanup function
  }
}
