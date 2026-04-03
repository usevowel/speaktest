/**
 * File upload component for Talker - allows direct markdown file upload
 */

import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTalkerStore } from '@/stores/talkerStore';
import { parseMarkdownPhrases } from '@/lib/parseMarkdown';
import type { MarkdownFile } from '@/shared/types';

export function FileUpload() {
  const { selectedFile, setSelectedFile } = useTalkerStore();

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Only accept markdown files
    if (!file.name.toLowerCase().endsWith('.md')) {
      alert('Please select a markdown (.md) file');
      return;
    }

    try {
      const content = await file.text();
      const phrases = parseMarkdownPhrases(content);

      const markdownFile: MarkdownFile = {
        id: `uploaded-${Date.now()}`,
        name: file.name,
        path: file.name,
        content,
        phrases,
      };

      setSelectedFile(markdownFile);
    } catch (error) {
      console.error('Failed to read file:', error);
      alert('Failed to read the selected file');
    }

    // Reset the input
    event.target.value = '';
  }, [setSelectedFile]);

  /**
   * Clear the selected file
   */
  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, [setSelectedFile]);

  if (selectedFile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded File:
            </h3>
            <span className="text-muted-foreground">{selectedFile.name}</span>
            <span className="text-sm text-muted-foreground">
              ({selectedFile.phrases.length} phrases)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFile}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Upload className="h-5 w-5" />
        Upload Markdown File
      </h3>

      <div className="space-y-2">
        <label className="text-sm font-medium">Select a markdown file to load phrases:</label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Markdown files only (.md)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".md"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
