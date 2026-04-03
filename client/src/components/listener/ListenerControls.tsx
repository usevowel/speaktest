/**
 * Listener controls component (status display only)
 */

import { useListenerStore } from '@/stores/listenerStore';

export function ListenerControls() {
  const {
    currentTranscription,
    error,
  } = useListenerStore();

  // Only show if there's something to display
  if (!currentTranscription && !error) {
    return null;
  }

  return (
    <div className="space-y-3 px-2">
      {/* Current Transcription Status - Processing */}
      {currentTranscription && (
        <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
            <strong className="font-semibold">Processing:</strong> {currentTranscription}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-xs sm:text-sm text-destructive">
            <strong className="font-semibold">Error:</strong> {error}
          </p>
        </div>
      )}
    </div>
  );
}
