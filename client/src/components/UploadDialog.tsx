/**
 * Upload dialog component for markdown file upload
 */

import React, { useCallback, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { parseMarkdownPhrases } from '@/lib/parseMarkdown';
import type { MarkdownFile } from '@/shared/types';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUploaded: (file: MarkdownFile) => void;
}

export function UploadDialog({ open, onOpenChange, onFileUploaded }: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      onFileUploaded(markdownFile);
      onOpenChange(false);
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to read file:', error);
      alert('Failed to read the selected file');
    }
  }, [onFileUploaded, onOpenChange]);

  /**
   * Trigger file input click
   */
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Markdown File</DialogTitle>
          <DialogDescription>
            Select a markdown file to load phrases for testing
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">Markdown files only (.md)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".md"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
