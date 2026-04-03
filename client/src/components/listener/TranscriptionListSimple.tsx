/**
 * Simplified transcription list component - shows last 5 transcriptions only
 * No filtering, sorting, or search - just a simple in-memory list
 */

import { useListenerStore } from '@/stores/listenerStore';

export function TranscriptionListSimple() {
  const { transcriptions } = useListenerStore();

  // Show last 5 transcriptions (most recent first)
  const displayTranscriptions = transcriptions.slice(0, 5);

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-base sm:text-lg font-semibold">
          Recent Transcriptions
        </h3>
        <span className="text-xs sm:text-sm text-muted-foreground">
          {transcriptions.length} total
        </span>
      </div>

      {displayTranscriptions.length === 0 ? (
        <div className="p-8 sm:p-12 text-center text-muted-foreground flex-1 flex flex-col items-center justify-center">
          <p className="text-sm sm:text-base">No transcriptions yet</p>
          <p className="text-xs sm:text-sm mt-2 opacity-70">Start listening to create transcriptions</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 flex-1 overflow-y-auto px-2 pb-2">
          {displayTranscriptions.map((transcription) => (
            <div
              key={transcription.id}
              className="p-3 sm:p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors shadow-sm"
            >
              <p className="text-sm sm:text-base leading-relaxed">{transcription.text}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(transcription.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
