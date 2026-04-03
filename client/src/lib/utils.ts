/**
 * Utility functions for the client application
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combine class names with Tailwind merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString();
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Local storage helpers
 */
export const storage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
};

/**
 * Audio utilities
 */
export const audio = {
  /**
   * Convert audio blob to base64
   */
  blobToBase64: (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:audio/... prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Create audio element from URL
   */
  createAudioElement: (url: string): HTMLAudioElement => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    return audio;
  },

  /**
   * Get user media for recording
   */
  getUserMedia: async (constraints: MediaStreamConstraints = { audio: true }): Promise<MediaStream> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('getUserMedia is not supported in this browser');
    }
    return navigator.mediaDevices.getUserMedia(constraints);
  },
};

/**
 * Keyboard utilities
 */
export const keyboard = {
  /**
   * Check if key event matches shortcut
   */
  matchesShortcut: (event: KeyboardEvent, key: string, modifiers?: string[]): boolean => {
    if (event.code !== key && event.key !== key) return false;
    
    if (modifiers) {
      const hasCtrl = modifiers.includes('ctrl') ? event.ctrlKey : !event.ctrlKey;
      const hasAlt = modifiers.includes('alt') ? event.altKey : !event.altKey;
      const hasShift = modifiers.includes('shift') ? event.shiftKey : !event.shiftKey;
      const hasMeta = modifiers.includes('meta') ? event.metaKey : !event.metaKey;
      
      return hasCtrl && hasAlt && hasShift && hasMeta;
    }
    
    return !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey;
  },
};
