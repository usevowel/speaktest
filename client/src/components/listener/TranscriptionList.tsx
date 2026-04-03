/**
 * Transcription list component with filtering and sorting
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Calendar,
  Languages,
  SortAsc,
  SortDesc,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListenerStore } from '@/stores/listenerStore';
import { formatDate } from '@/lib/utils';
import { STT_LANGUAGES, ASSEMBLYAI_STT_STREAMING_LANGUAGES } from '@/constants';
import type { TranscriptionSort, STTLanguage } from '@/shared/types';

/** Set of languages supported by AssemblyAI STT Streaming for quick lookup */
const ASSEMBLYAI_SUPPORTED_SET = new Set(ASSEMBLYAI_STT_STREAMING_LANGUAGES);

export function TranscriptionList() {
  const {
    transcriptions,
    filters,
    sort,
    setFilters,
    setSort,
    getFilteredTranscriptions,
    removeTranscription,
    clearTranscriptions,
  } = useListenerStore();

  const [searchText, setSearchText] = useState(filters.searchText || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const filteredTranscriptions = useMemo(() => {
    return getFilteredTranscriptions();
  }, [getFilteredTranscriptions]);

  /**
   * Handle search text change
   */
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setFilters({ searchText: text || undefined });
  };

  /**
   * Handle language filter change
   */
  const handleLanguageFilter = (language: string) => {
    setFilters({ 
      language: language === 'all' ? undefined : language as STTLanguage 
    });
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (field: TranscriptionSort['field']) => {
    const newDirection = sort.field === field && sort.direction === 'desc' ? 'asc' : 'desc';
    setSort({ field, direction: newDirection });
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchText('');
    setFilters({});
  };

  /**
   * Export transcriptions as JSON
   */
  const exportTranscriptions = () => {
    const dataStr = JSON.stringify(filteredTranscriptions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcriptions-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  /**
   * Confirm and clear all transcriptions
   */
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all transcriptions? This action cannot be undone.')) {
      clearTranscriptions();
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
            <h3 className="text-lg font-semibold">
              Transcriptions ({filteredTranscriptions.length})
            </h3>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          {filteredTranscriptions.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={exportTranscriptions}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <CollapsibleContent>
        {/* Search and Filters */}
        <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transcriptions..."
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Language Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Language:</label>
                <Select
                  value={filters.language || 'all'}
                  onValueChange={handleLanguageFilter}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {STT_LANGUAGES.map((lang) => {
                      const isSupported = ASSEMBLYAI_SUPPORTED_SET.has(lang);
                      return (
                        <SelectItem key={lang} value={lang}>
                          <span className="capitalize">
                            {lang}
                            {!isSupported && ' *'}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range - Simplified for now */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range:</label>
                <div className="text-sm text-muted-foreground">
                  Coming soon...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2">
        <Button
          variant={sort.field === 'timestamp' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSortChange('timestamp')}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Date
          {sort.field === 'timestamp' && (
            sort.direction === 'desc' ? <SortDesc className="h-3 w-3 ml-1" /> : <SortAsc className="h-3 w-3 ml-1" />
          )}
        </Button>
        
        <Button
          variant={sort.field === 'language' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSortChange('language')}
        >
          <Languages className="h-4 w-4 mr-1" />
          Language
          {sort.field === 'language' && (
            sort.direction === 'desc' ? <SortDesc className="h-3 w-3 ml-1" /> : <SortAsc className="h-3 w-3 ml-1" />
          )}
        </Button>
      </div>

      {/* Transcription Items */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTranscriptions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {transcriptions.length === 0 ? (
              <div>
                <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transcriptions yet</p>
                <p className="text-sm">Start listening to create transcriptions</p>
              </div>
            ) : (
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No transcriptions match your filters</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        ) : (
          filteredTranscriptions.map((transcription) => (
            <div
              key={transcription.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">
                    {transcription.text}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transcription.timestamp)}
                    </span>
                    
                    <span className="flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      <span className="capitalize">{transcription.language}</span>
                    </span>
                    
                    {transcription.confidence && (
                      <span>
                        Confidence: {Math.round(transcription.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTranscription(transcription.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
