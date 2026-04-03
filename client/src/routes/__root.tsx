import { createRootRoute, Outlet } from '@tanstack/react-router'

/**
 * Root route component
 */
function RootComponent() {
  return (
    <>
      <Outlet />
    </>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
