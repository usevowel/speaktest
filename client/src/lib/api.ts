/**
 * API client for vowel.to tester
 */

import type {
  ApiResponse,
  Project,
  MarkdownFile,
  TranslationRequest,
  TranslationResponse,
  TTSRequest,
  TTSResponse,
  STTRequest,
  STTResponse,
  Transcription,
  TranscriptionFilters,
  TranscriptionSort,
} from '@/shared/types';

const API_BASE = '/api';

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Check if response has content before trying to parse
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');
    
    let data: any;
    
    if (hasJsonContent) {
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(`Failed to parse JSON response from ${endpoint}:`, jsonError);
        throw new Error(`Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : 'Parse error'}`);
      }
    } else {
      // Non-JSON response (HTML error page, etc.)
      const text = await response.text();
      console.error(`Expected JSON but got: ${contentType}`, text.substring(0, 200));
      throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Project API
 */
export const projectApi = {
  /**
   * Get all projects
   */
  getAll: (): Promise<ApiResponse<Project[]>> => {
    return apiRequest<Project[]>('/projects');
  },

  /**
   * Get a specific project
   */
  getById: (id: string): Promise<ApiResponse<Project>> => {
    return apiRequest<Project>(`/projects/${encodeURIComponent(id)}`);
  },

  /**
   * Get a specific project (alias for getById)
   */
  get: (id: string): Promise<ApiResponse<Project>> => {
    return apiRequest<Project>(`/projects/${encodeURIComponent(id)}`);
  },

  /**
   * Create a new project
   */
  create: (name: string): Promise<ApiResponse<Project>> => {
    return apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  /**
   * Get a specific markdown file
   */
  getFile: (projectId: string, filePath: string): Promise<ApiResponse<MarkdownFile>> => {
    return apiRequest<MarkdownFile>(`/projects/${encodeURIComponent(projectId)}/files/${filePath}`);
  },
};

/**
 * Translation API
 */
export const translationApi = {
  /**
   * Translate text
   */
  translate: (request: TranslationRequest): Promise<ApiResponse<TranslationResponse>> => {
    return apiRequest<TranslationResponse>('/translate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Detect language
   */
  detectLanguage: (text: string): Promise<ApiResponse<{ language: string }>> => {
    return apiRequest<{ language: string }>('/translate/detect', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
};

/**
 * Text-to-Speech API
 */
export const ttsApi = {
  /**
   * Convert text to speech
   */
  synthesize: (request: TTSRequest): Promise<ApiResponse<TTSResponse>> => {
    return apiRequest<TTSResponse>('/tts', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  /**
   * Get supported voices for a language (with client-side caching)
   */
  getVoices: async (language: string): Promise<ApiResponse<string[]>> => {
    // Check cache first
    const { getCachedVoices, cacheVoices } = await import('./voices-cache');
    const cached = getCachedVoices(language);
    if (cached) {
      return {
        success: true,
        data: cached,
      };
    }
    
    // Fetch from API
    const response = await apiRequest<string[]>(`/tts/voices/${encodeURIComponent(language)}`);
    
    // Cache successful responses
    if (response.success && response.data) {
      cacheVoices(language, response.data);
    }
    
    return response;
  },

  /**
   * Check TTS service status
   */
  getStatus: (): Promise<ApiResponse<{ available: boolean }>> => {
    return apiRequest<{ available: boolean }>('/tts/status');
  },
};

/**
 * Speech-to-Text API
 */
export const sttApi = {
  /**
   * Convert speech to text
   */
  transcribe: async (audioBlob: Blob, language: string): Promise<ApiResponse<STTResponse>> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('language', language);

    return apiRequest<STTResponse>('/stt', {
      method: 'POST',
      headers: {}, // Don't set Content-Type for FormData
      body: formData,
    });
  },

  /**
   * Check STT service status
   */
  getStatus: (): Promise<ApiResponse<{ available: boolean }>> => {
    return apiRequest<{ available: boolean }>('/stt/status');
  },
};

/**
 * Transcription API
 */
export const transcriptionApi = {
  /**
   * Get all transcriptions with filtering and sorting
   */
  getAll: (
    filters?: TranscriptionFilters,
    sort?: TranscriptionSort,
    pagination?: { limit?: number; offset?: number }
  ): Promise<ApiResponse<{
    transcriptions: Transcription[];
    total: number;
    offset: number;
    limit: number;
  }>> => {
    const params = new URLSearchParams();
    
    if (filters?.language) params.append('language', filters.language);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString());
    if (filters?.dateTo) params.append('dateTo', filters.dateTo.toISOString());
    if (filters?.searchText) params.append('searchText', filters.searchText);
    
    if (sort?.field) params.append('sortField', sort.field);
    if (sort?.direction) params.append('sortDirection', sort.direction);
    
    if (pagination?.limit) params.append('limit', pagination.limit.toString());
    if (pagination?.offset) params.append('offset', pagination.offset.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/transcriptions?${queryString}` : '/transcriptions';
    
    return apiRequest(endpoint);
  },

  /**
   * Add a new transcription
   */
  add: (transcription: Omit<Transcription, 'id' | 'timestamp'>): Promise<ApiResponse<Transcription>> => {
    return apiRequest<Transcription>('/transcriptions', {
      method: 'POST',
      body: JSON.stringify(transcription),
    });
  },

  /**
   * Delete a transcription
   */
  delete: (id: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    return apiRequest<{ deleted: boolean }>(`/transcriptions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Clear all transcriptions
   */
  clear: (): Promise<ApiResponse<{ deleted: number }>> => {
    return apiRequest<{ deleted: number }>('/transcriptions', {
      method: 'DELETE',
    });
  },
};

/**
 * Health check API
 */
export const healthApi = {
  /**
   * Check server health
   */
  check: (): Promise<ApiResponse<{ status: string; timestamp: string; environment: string }>> => {
    return apiRequest('/health');
  },
};

/**
 * Sample project API
 */
export const sampleProjectApi = {
  /**
   * Get all markdown files in sample-project directory
   */
  getMarkdownFiles: (): Promise<ApiResponse<Array<{ name: string; path: string }>>> => {
    return apiRequest('/markdown/sample-project');
  },
  
  /**
   * Get a markdown file from sample-project (returns plain text content)
   */
  getFile: async (filePath: string): Promise<ApiResponse<string>> => {
    try {
      const response = await fetch(`${API_BASE}/markdown?path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/markdown')) {
        const content = await response.text();
        return {
          success: true,
          data: content,
        };
      }
      
      // Try to parse as JSON if not markdown
      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error(`API request failed: /markdown?path=${filePath}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
