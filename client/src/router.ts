import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

/**
 * Router configuration
 * Debug logging is disabled by default
 */
export const router = createRouter({ 
  routeTree,
  defaultPreload: false,
})
