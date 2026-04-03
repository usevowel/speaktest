/**
 * Transcription management API routes
 */

import { Router } from 'express';
import type { ApiResponse, Transcription, TranscriptionFilters, TranscriptionSort } from '../../../shared/types';

const router = Router();

// In-memory storage for transcriptions (in production, use a database)
let transcriptions: Transcription[] = [];

/**
 * GET /api/transcriptions - Get all transcriptions with optional filtering and sorting
 */
router.get('/', (req, res) => {
  try {
    const {
      language,
      dateFrom,
      dateTo,
      searchText,
      sortField = 'timestamp',
      sortDirection = 'desc',
      limit = 100,
      offset = 0,
    } = req.query;

    let filteredTranscriptions = [...transcriptions];

    // Apply filters
    if (language) {
      filteredTranscriptions = filteredTranscriptions.filter(t => t.language === language);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom as string);
      filteredTranscriptions = filteredTranscriptions.filter(t => new Date(t.timestamp) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo as string);
      filteredTranscriptions = filteredTranscriptions.filter(t => new Date(t.timestamp) <= toDate);
    }

    if (searchText) {
      const searchLower = (searchText as string).toLowerCase();
      filteredTranscriptions = filteredTranscriptions.filter(t => 
        t.text.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filteredTranscriptions.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'language':
          aValue = a.language;
          bValue = b.language;
          break;
        case 'text':
          aValue = a.text;
          bValue = b.text;
          break;
        default:
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
      }

      if (sortDirection === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    // Apply pagination
    const startIndex = parseInt(offset as string) || 0;
    const limitNum = parseInt(limit as string) || 100;
    const paginatedTranscriptions = filteredTranscriptions.slice(startIndex, startIndex + limitNum);

    const response: ApiResponse<{
      transcriptions: Transcription[];
      total: number;
      offset: number;
      limit: number;
    }> = {
      success: true,
      data: {
        transcriptions: paginatedTranscriptions,
        total: filteredTranscriptions.length,
        offset: startIndex,
        limit: limitNum,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching transcriptions:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch transcriptions',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/transcriptions - Add a new transcription
 */
router.post('/', (req, res) => {
  try {
    const { text, language, confidence, duration } = req.body;

    if (!text || !language) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid request',
        message: 'Text and language are required',
      };

      return res.status(400).json(response);
    }

    const transcription: Transcription = {
      id: `transcription-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      language,
      timestamp: new Date(),
      confidence,
      duration,
    };

    transcriptions.push(transcription);

    const response: ApiResponse<Transcription> = {
      success: true,
      data: transcription,
      message: 'Transcription added successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding transcription:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to add transcription',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * DELETE /api/transcriptions/:id - Delete a transcription
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const index = transcriptions.findIndex(t => t.id === id);

    if (index === -1) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Transcription not found',
        message: `Transcription with ID "${id}" does not exist`,
      };

      return res.status(404).json(response);
    }

    transcriptions.splice(index, 1);

    const response: ApiResponse<{ deleted: boolean }> = {
      success: true,
      data: { deleted: true },
      message: 'Transcription deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting transcription:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to delete transcription',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

/**
 * DELETE /api/transcriptions - Clear all transcriptions
 */
router.delete('/', (req, res) => {
  try {
    const count = transcriptions.length;
    transcriptions = [];

    const response: ApiResponse<{ deleted: number }> = {
      success: true,
      data: { deleted: count },
      message: `Cleared ${count} transcriptions`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error clearing transcriptions:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to clear transcriptions',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    res.status(500).json(response);
  }
});

export { router as transcriptionRoutes };
