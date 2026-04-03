/**
 * Project selection component for Talker
 */

import React, { useEffect, useState } from 'react';
import { FolderOpen, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTalkerStore } from '@/stores/talkerStore';
import { projectApi } from '@/lib/api';
import type { Project } from '@/shared/types';

export function ProjectSelector() {
  const {
    projects,
    selectedProject,
    setProjects,
    setSelectedProject,
  } = useTalkerStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load projects from API
   */
  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectApi.getAll();
      
      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        setError(response.error || 'Failed to load projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new project
   */
  const createProject = async () => {
    const name = prompt('Enter project name:');
    if (!name) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await projectApi.create(name);
      
      if (response.success && response.data) {
        await loadProjects(); // Refresh the list
        setSelectedProject(response.data);
      } else {
        setError(response.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle project selection
   */
  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
  };

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Project Selection
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProjects}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={createProject}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Select Project:</label>
        <Select
          value={selectedProject?.id || ''}
          onValueChange={handleProjectSelect}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a project..." />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>{project.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({project.markdownFiles.length} files)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
