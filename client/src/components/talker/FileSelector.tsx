/**
 * Markdown file selection component for Talker
 */

import React, { useEffect } from 'react';
import { FileText, Hash } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTalkerStore } from '@/stores/talkerStore';
import { projectApi } from '@/lib/api';

export function FileSelector() {
  const {
    selectedProject,
    selectedFile,
    projectFiles,
    setSelectedFile,
    setProjectFiles,
  } = useTalkerStore();

  /**
   * Load project files when project changes
   */
  useEffect(() => {
    if (selectedProject) {
      loadProjectFiles();
    } else {
      setProjectFiles([]);
    }
  }, [selectedProject]);

  /**
   * Load project files with metadata only
   */
  const loadProjectFiles = async () => {
    if (!selectedProject) return;

    try {
      const response = await projectApi.get(selectedProject.id);
      if (response.success && response.data) {
        setProjectFiles(response.data.markdownFiles);
      }
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  };

  /**
   * Handle file selection - fetch fresh content
   */
  const handleFileSelect = async (fileId: string) => {
    if (!selectedProject) return;

    try {
      // Find the file metadata
      const fileMeta = projectFiles.find(f => f.id === fileId);
      if (!fileMeta) return;

      // Fetch fresh content from server
      const response = await projectApi.getFile(selectedProject.id, fileMeta.name);
      if (response.success && response.data) {
        setSelectedFile(response.data);
      }
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  if (!selectedProject) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          File Selection
        </h3>
        <div className="p-4 bg-muted/50 rounded-md text-center text-muted-foreground">
          Please select a project first
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" />
        File Selection
      </h3>

      <div className="space-y-2">
        <label className="text-sm font-medium">Select Markdown File:</label>
        <Select
          value={selectedFile?.id || ''}
          onValueChange={handleFileSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a markdown file..." />
          </SelectTrigger>
          <SelectContent>
            {projectFiles.map((file) => (
              <SelectItem key={file.id} value={file.id}>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {projectFiles.length === 0 && (
        <div className="p-4 bg-muted/50 rounded-md text-center text-muted-foreground">
          No markdown files found in this project
        </div>
      )}
    </div>
  );
}
