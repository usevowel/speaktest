/**
 * useFullscreen Hook
 * 
 * React hook that provides fullscreen functionality using the Fullscreen API.
 * Handles entering and exiting fullscreen mode, and tracks the current state.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Check if the device is a mobile device
 */
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
}

/**
 * Hook for managing fullscreen functionality
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * Check if document is currently in fullscreen mode
   */
  const checkFullscreen = useCallback(() => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    setIsFullscreen(isCurrentlyFullscreen);
    return isCurrentlyFullscreen;
  }, []);

  /**
   * Enter fullscreen mode
   */
  const enterFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      
      setIsFullscreen(true);
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  }, []);

  /**
   * Exit fullscreen mode
   */
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      
      setIsFullscreen(false);
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  }, []);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(async () => {
    const isCurrentlyFullscreen = checkFullscreen();
    if (isCurrentlyFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [checkFullscreen, enterFullscreen, exitFullscreen]);

  /**
   * Listen for fullscreen change events
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      checkFullscreen();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Check initial state
    checkFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [checkFullscreen]);

  /**
   * Enter fullscreen on mount (mobile only)
   */
  useEffect(() => {
    // Only automatically enter fullscreen on mobile devices
    if (!isMobileDevice()) {
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      enterFullscreen();
    }, 100);

    return () => clearTimeout(timer);
  }, [enterFullscreen]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
