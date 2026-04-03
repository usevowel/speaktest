/**
 * Main Talker tab component
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhraseButtons } from '@/components/PhraseButtons';
import { sampleProjectApi } from '@/lib/api';
import { parseMarkdownPhrases, parseMarkdownSections } from '@/lib/parseMarkdown';
import { useTalkerStore } from '@/stores/talkerStore';
import type { MarkdownFile } from '@/shared/types';
import type { MarkdownSection } from '@/lib/parseMarkdown';

export function TalkerTab() {
  const [sampleFiles, setSampleFiles] = useState<Array<{ name: string; path: string }>>([]);
  const [selectedSampleFile, setSelectedSampleFile] = useState<string>('');
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [sections, setSections] = useState<MarkdownSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const { setSelectedFile, selectedFile } = useTalkerStore();

  /**
   * Handle uploaded file from store (when file is uploaded via UploadDialog)
   */
  useEffect(() => {
    if (selectedFile && !selectedFile.id.startsWith('sample-')) {
      // This is an uploaded file, not a sample file
      setSelectedFileContent(selectedFile.content);
      setSelectedSampleFile(''); // Clear sample file selection
      
      // Parse sections
      const parsedSections = parseMarkdownSections(selectedFile.content);
      setSections(parsedSections);
      
      // Set first section as selected
      if (parsedSections.length > 0) {
        setSelectedSection(parsedSections[0].id);
      }
    }
  }, [selectedFile]);

  /**
   * Load sample project markdown files
   */
  useEffect(() => {
    const loadSampleFiles = async () => {
      try {
        const response = await sampleProjectApi.getMarkdownFiles();
        if (response.success && response.data) {
          setSampleFiles(response.data);
        }
      } catch (error) {
        console.error('Failed to load sample files:', error);
      }
    };
    loadSampleFiles();
  }, []);

  /**
   * Handle sample file selection
   */
  const handleSampleFileSelect = useCallback(async (filePath: string) => {
    try {
      const response = await sampleProjectApi.getFile(filePath);
      if (response.success && response.data) {
        const content = response.data;
        setSelectedFileContent(content);
        setSelectedSampleFile(filePath);
        
        // Parse sections
        const parsedSections = parseMarkdownSections(content);
        setSections(parsedSections);
        
        // Set first section as selected
        if (parsedSections.length > 0) {
          setSelectedSection(parsedSections[0].id);
        }
        
        // Create markdown file object
        const phrases = parseMarkdownPhrases(content);
        const markdownFile: MarkdownFile = {
          id: `sample-${filePath}`,
          name: filePath.split('/').pop() || filePath,
          path: filePath,
          content,
          phrases,
        };
        
        setSelectedFile(markdownFile);
      }
    } catch (error) {
      console.error('Failed to load sample file:', error);
    }
  }, [setSelectedFile]);

  /**
   * Auto-select first file when sample files are loaded
   */
  useEffect(() => {
    if (sampleFiles.length > 0 && !selectedSampleFile) {
      const firstFile = sampleFiles[0];
      handleSampleFileSelect(firstFile.path);
    }
  }, [sampleFiles, selectedSampleFile, handleSampleFileSelect]);

  /**
   * Handle section selection
   */
  const handleSectionSelect = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  /**
   * Get phrases for selected section
   */
  const getSelectedSectionPhrases = () => {
    if (!selectedSection) return [];
    const section = sections.find(s => s.id === selectedSection);
    return section?.phrases || [];
  };

  return (
    <div className="p-0.5 sm:p-4 space-y-4 flex flex-col flex-1">
      {/* File and Section Selects - Always on same row */}
      <div className="flex flex-row items-center gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <label className="text-sm font-medium hidden sm:inline">Sample Project File:</label>
          <Select value={selectedSampleFile} onValueChange={handleSampleFileSelect}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Select a markdown file..." />
            </SelectTrigger>
            <SelectContent>
              {sampleFiles.map((file) => (
                <SelectItem key={file.path} value={file.path}>
                  {file.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section Selector - Only show if file is selected (sample or uploaded) and has sections */}
        {(selectedSampleFile || selectedFileContent) && sections.length > 0 && (
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <label className="text-sm font-medium hidden sm:inline">Section:</label>
            <Select value={selectedSection} onValueChange={handleSectionSelect}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select a section..." />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Phrase Buttons - Show phrases for selected section with vertical scroll */}
      {selectedSection && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2 hidden sm:block">Phrases:</h3>
          <div className="max-h-full overflow-y-auto">
            <PhraseButtons phrases={getSelectedSectionPhrases()} />
          </div>
        </div>
      )}
    </div>
  );
}
