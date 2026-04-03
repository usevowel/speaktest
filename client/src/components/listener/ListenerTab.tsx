/**
 * Main Listener tab component
 */

import React, { useEffect } from 'react';
import { ListenerControls } from './ListenerControls';
import { TranscriptionListSimple } from './TranscriptionListSimple';
import { useListening } from '@/hooks/useListening';

export function ListenerTab() {
  const { cleanup } = useListening();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="p-2 sm:p-6 flex flex-col flex-1 space-y-4 sm:space-y-6">
      {/* Status - Show at top if there's current activity */}
      <ListenerControls />
      
      {/* Transcriptions - Main content area */}
      <div className="flex-1 min-h-0">
        <TranscriptionListSimple />
      </div>
    </div>
  );
}
