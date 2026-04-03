import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react';
import { Upload, MicOff, Keyboard, MessageSquare, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { FaAssistiveListeningSystems } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { MainContent } from '@/components/MainContent';
import { UploadDialog } from '@/components/UploadDialog';
import { PhraseDialog } from '@/components/PhraseDialog';
import { useTalkerStore } from '@/stores/talkerStore';
import { useListenerStore } from '@/stores/listenerStore';
import { useListening } from '@/hooks/useListening';
import { useUrlState } from '@/hooks/useUrlState';
import { useFullscreen } from '@/hooks/useFullscreen';
import type { MarkdownFile } from '@/shared/types';

function IndexComponent() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [phraseDialogOpen, setPhraseDialogOpen] = useState(false);
  const { setSelectedFile } = useTalkerStore();
  const { isListening, isProcessing, toggleListening, checkSTTStatus } = useListening();
  const { isUserSpeaking, isWaitingForSTT } = useListenerStore();
  const [sttAvailable, setSTTAvailable] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  
  // Sync URL state with store
  useUrlState();

  /**
   * Check STT service availability on mount
   */
  useEffect(() => {
    checkSTTStatus()
      .then(setSTTAvailable)
      .catch((error) => {
        console.warn('Failed to check STT status:', error);
        // Default to available if check fails - let the actual API call handle errors
        setSTTAvailable(true);
      });
  }, [checkSTTStatus]);

  /**
   * Handle toggle listening with error handling
   */
  const handleToggleListening = async () => {
    try {
      await toggleListening();
    } catch (error) {
      console.error('Error toggling listening:', error);
      // Error is already handled in useListening hook
    }
  };

  /**
   * Handle file upload
   */
  const handleFileUploaded = (file: MarkdownFile) => {
    setSelectedFile(file);
    setUploadDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-[15px] py-[15px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold flex">
                  <span className="font-ocr-a" style={{ lineHeight: '34px'}}>vowel</span>
                  <span className="font-light" >|</span>
                  <span className="font-light" style={{ marginTop: "1px"}}>test</span>
                </h1>
              </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-muted-foreground hover:text-foreground"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPhraseDialogOpen(true)}
                className="text-muted-foreground hover:text-foreground"
                title="Type and play phrase"
              >
                <Keyboard className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUploadDialogOpen(true)}
                className="text-muted-foreground hover:text-foreground"
                title="Upload markdown file"
              >
                <Upload className="h-5 w-5" />
              </Button>
              <Button
                variant={isListening ? "default" : "destructive"}
                size="icon"
                onClick={handleToggleListening}
                disabled={isProcessing}
                className={
                  isUserSpeaking
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : isListening
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "text-white hover:text-white"
                }
                title={
                  isProcessing
                    ? "Processing..."
                    : !sttAvailable
                    ? "STT service not configured (DEEPGRAM_API_KEY or GROQ_API_KEY missing)"
                    : isUserSpeaking
                    ? "User Speaking"
                    : isListening
                    ? "Stop Listening"
                    : "Start Listening"
                }
              >
                {isUserSpeaking ? (
                  <MessageSquare className="h-5 w-5" />
                ) : isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isListening ? (
                  <FaAssistiveListeningSystems className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container flex-1 flex flex-col h-full mx-auto px-[15px] py-[15px]">
        <MainContent />
      </main>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onFileUploaded={handleFileUploaded}
      />

      {/* Phrase Dialog */}
      <PhraseDialog
        open={phraseDialogOpen}
        onOpenChange={setPhraseDialogOpen}
      />
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: IndexComponent,
})
