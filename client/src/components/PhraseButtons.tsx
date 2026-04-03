/**
 * Phrase buttons component - displays clickable buttons for each phrase
 */

import React from 'react';
import { Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTalkerActions } from '@/hooks/useTalkerActions';
import { useTalkerStore } from '@/stores/talkerStore';
import type { Phrase } from '@/shared/types';

interface PhraseButtonsProps {
  phrases: Phrase[];
}

export function PhraseButtons({ phrases }: PhraseButtonsProps) {
  const { playPhrase } = useTalkerActions();
  const { isPlaying, isTranslating, isLoadingAudio, selectedPhrase, selectedFile, setSelectedPhrase } = useTalkerStore();

  /**
   * Handle phrase button click
   */
  const handlePhraseClick = async (phrase: Phrase) => {
    if (isPlaying || isTranslating || isLoadingAudio) {
      return; // Prevent multiple simultaneous plays
    }
    
    console.log('🔘 Phrase clicked:', { 
      phraseId: phrase.id, 
      phraseText: phrase.text, 
      textLength: phrase.text?.length,
      textType: typeof phrase.text,
      phraseObject: phrase 
    });
    
    // Validate phrase text before proceeding
    if (!phrase.text || typeof phrase.text !== 'string' || phrase.text.trim().length === 0) {
      console.error('❌ Invalid phrase text:', phrase);
      return;
    }
    
    // Find the phrase index in the selected file to properly set the selected phrase
    if (selectedFile) {
      const phraseIndex = selectedFile.phrases.findIndex(p => p.id === phrase.id);
      if (phraseIndex !== -1) {
        setSelectedPhrase(phrase, phraseIndex);
      } else {
        // Fallback: just set the phrase without index if not found in file
        setSelectedPhrase(phrase);
      }
    } else {
      // Fallback: just set the phrase if no file is selected
      setSelectedPhrase(phrase);
    }
    
    await playPhrase(phrase.text);
  };

  if (phrases.length === 0) {
    return (
      <div className="p-8 bg-muted/50 rounded-md text-center text-muted-foreground">
        <p>No phrases available in this section</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {phrases.map((phrase) => {
        const isSelected = selectedPhrase?.id === phrase.id;
        const isCurrentlyPlaying = isSelected && (isPlaying || isTranslating || isLoadingAudio);
        
        return (
          <Button
            key={phrase.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handlePhraseClick(phrase)}
            disabled={isCurrentlyPlaying || (isPlaying && !isSelected)}
            className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
          >
            {isCurrentlyPlaying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                <span className="truncate">{phrase.text}</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{phrase.text}</span>
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
}
