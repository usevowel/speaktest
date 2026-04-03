/**
 * Phrase dialog component - allows typing and playing phrases
 */

import React, { useState } from 'react';
import { Keyboard, Play, Square, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTalkerActions } from '@/hooks/useTalkerActions';
import { useTalkerStore } from '@/stores/talkerStore';

interface PhraseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PhraseDialog({ open, onOpenChange }: PhraseDialogProps) {
  const [phrase, setPhrase] = useState('');
  const { playPhrase, stopPlayback } = useTalkerActions();
  const { isPlaying, isTranslating, isLoadingAudio } = useTalkerStore();

  /**
   * Handle play button click
   */
  const handlePlay = async () => {
    if (!phrase.trim()) return;
    await playPhrase(phrase.trim());
  };

  /**
   * Handle stop button click
   */
  const handleStop = () => {
    stopPlayback();
  };

  /**
   * Handle dialog close - clear phrase and stop playback
   */
  const handleClose = (open: boolean) => {
    if (!open) {
      setPhrase('');
      stopPlayback();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Type and Play Phrase
          </DialogTitle>
          <DialogDescription>
            Type a phrase and click play to hear it spoken
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Type your phrase here..."
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            className="min-h-[120px] resize-none"
            onKeyDown={(e) => {
              // Allow Ctrl/Cmd+Enter to play
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (!isPlaying) {
                  handlePlay();
                } else {
                  handleStop();
                }
              }
            }}
          />
          
          <div className="flex items-center justify-end gap-2">
            {isPlaying ? (
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={isTranslating || isLoadingAudio}
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button
                onClick={handlePlay}
                disabled={!phrase.trim() || isTranslating || isLoadingAudio}
              >
                {isTranslating || isLoadingAudio ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isTranslating ? 'Translating...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Tip: Press Ctrl/Cmd+Enter to play or stop
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
