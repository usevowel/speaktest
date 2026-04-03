/**
 * Hook to sync URL search params with Talker store state
 * 
 * This hook manages bidirectional sync between URL search params and the Zustand store:
 * - Reads from URL on mount and updates store
 * - Updates URL when store state changes
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useTalkerStore } from '@/stores/talkerStore';
import { projectApi } from '@/lib/api';
import type { TTSLanguage } from '@/shared/types';

/**
 * Search params schema for the index route
 */
export interface IndexSearchParams {
  projectId?: string;
  fileId?: string;
  sourceLanguage?: string;
  targetLanguage?: TTSLanguage;
  voice?: string;
  speed?: string;
  phraseIndex?: string;
  phraseFilterMode?: 'all' | 'no_prefix' | 'response';
}

/**
 * Hook to sync URL state with Talker store
 */
export function useUrlState() {
  const navigate = useNavigate();
  // @ts-ignore - Route search type doesn't match IndexSearchParams exactly
  const searchParams = useSearch({ from: '/', strict: false }) as IndexSearchParams;
  const isInitializedRef = useRef(false);
  const isUpdatingUrlRef = useRef(false);

  const {
    selectedProject,
    selectedFile,
    currentPhraseIndex,
    phraseFilterMode,
    sourceLanguage,
    targetLanguage,
    voice,
    speed,
    setSelectedProject,
    setSelectedFile,
    setCurrentPhraseIndex,
    setPhraseFilterMode,
    setSourceLanguage,
    setTargetLanguage,
    setVoice,
    setSpeed,
    setProjectFiles,
  } = useTalkerStore();

  /**
   * Update URL search params from store state
   */
  const updateUrlFromStore = () => {
    if (isUpdatingUrlRef.current) return; // Prevent infinite loops
    
    isUpdatingUrlRef.current = true;
    
    const params: IndexSearchParams = {};
    
    if (selectedProject?.id) {
      params.projectId = selectedProject.id;
    }
    
    if (selectedFile?.id) {
      params.fileId = selectedFile.id;
    }
    
    if (sourceLanguage && sourceLanguage !== 'english') {
      params.sourceLanguage = sourceLanguage;
    }
    
    if (targetLanguage && targetLanguage !== 'en-us') {
      params.targetLanguage = targetLanguage;
    }
    
    if (voice && voice !== 'Ashley') {
      params.voice = voice;
    }
    
    if (speed && speed !== 1.0) {
      params.speed = speed.toString();
    }
    
    if (currentPhraseIndex && currentPhraseIndex !== 0) {
      params.phraseIndex = currentPhraseIndex.toString();
    }
    
    if (phraseFilterMode && phraseFilterMode !== 'response') {
      params.phraseFilterMode = phraseFilterMode;
    }
    
    // Only update URL if params have changed
    const currentParams = searchParams as IndexSearchParams;
    const paramsChanged = 
      params.projectId !== currentParams.projectId ||
      params.fileId !== currentParams.fileId ||
      params.sourceLanguage !== currentParams.sourceLanguage ||
      params.targetLanguage !== currentParams.targetLanguage ||
      params.voice !== currentParams.voice ||
      params.speed !== currentParams.speed ||
      params.phraseIndex !== currentParams.phraseIndex ||
      params.phraseFilterMode !== currentParams.phraseFilterMode;
    
    if (paramsChanged) {
      navigate({
        search: params as any,
        replace: true, // Use replace to avoid cluttering history
      });
    }
    
    isUpdatingUrlRef.current = false;
  };

  /**
   * Initialize store from URL params on mount
   */
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const loadFromUrl = async () => {
      const params = searchParams as IndexSearchParams;
      
      // Load projects if not already loaded
      let projects = useTalkerStore.getState().projects;
      if (projects.length === 0) {
        try {
          const response = await projectApi.getAll();
          if (response.success && response.data) {
            useTalkerStore.getState().setProjects(response.data);
            projects = response.data;
          }
        } catch (error) {
          console.error('Failed to load projects from URL:', error);
        }
      }
      
      // Set project from URL
      if (params.projectId && projects.length > 0) {
        const project = projects.find(p => p.id === params.projectId);
        const currentSelectedProject = useTalkerStore.getState().selectedProject;
        
        if (project && project.id !== currentSelectedProject?.id) {
          setSelectedProject(project);
          
          // Load project files
          try {
            const projectResponse = await projectApi.get(project.id);
            if (projectResponse.success && projectResponse.data) {
              setProjectFiles(projectResponse.data.markdownFiles);
              
              // Set file from URL
              if (params.fileId) {
                const fileMeta = projectResponse.data.markdownFiles.find(
                  f => f.id === params.fileId
                );
                if (fileMeta) {
                  const fileResponse = await projectApi.getFile(project.id, fileMeta.name);
                  if (fileResponse.success && fileResponse.data) {
                    setSelectedFile(fileResponse.data);
                    
                    // Set phrase index after file is loaded
                    if (params.phraseIndex) {
                      const index = parseInt(params.phraseIndex, 10);
                      if (!isNaN(index) && index >= 0) {
                        // Use setTimeout to ensure file phrases are loaded
                        setTimeout(() => {
                          setCurrentPhraseIndex(index);
                        }, 100);
                      }
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Failed to load project files from URL:', error);
          }
        }
      }
      
      // Set language settings from URL (only if not already set from project/file)
      if (params.sourceLanguage) {
        setSourceLanguage(params.sourceLanguage);
      }
      
      if (params.targetLanguage) {
        setTargetLanguage(params.targetLanguage);
      }
      
      if (params.voice) {
        setVoice(params.voice);
      }
      
      if (params.speed) {
        const speedValue = parseFloat(params.speed);
        if (!isNaN(speedValue)) {
          setSpeed(speedValue);
        }
      }
      
      if (params.phraseFilterMode) {
        setPhraseFilterMode(params.phraseFilterMode);
      }
      
      // Only set phrase index if file wasn't loaded from URL (already handled above)
      if (params.phraseIndex && !params.fileId) {
        const index = parseInt(params.phraseIndex, 10);
        if (!isNaN(index) && index >= 0) {
          setCurrentPhraseIndex(index);
        }
      }
      
      isInitializedRef.current = true;
    };
    
    loadFromUrl();
  }, []);

  /**
   * Update URL when store state changes
   */
  useEffect(() => {
    if (!isInitializedRef.current) return; // Don't update URL during initialization
    if (isUpdatingUrlRef.current) return; // Prevent updates during URL updates
    
    updateUrlFromStore();
  }, [
    selectedProject?.id,
    selectedFile?.id,
    currentPhraseIndex,
    phraseFilterMode,
    sourceLanguage,
    targetLanguage,
    voice,
    speed,
  ]);

  return {
    searchParams: searchParams as IndexSearchParams,
  };
}
