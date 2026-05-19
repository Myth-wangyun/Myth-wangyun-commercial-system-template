import React, { Suspense } from 'react'

const RouterShell = React.lazy(() => import('./RouterShell'))

const routerFallback = <div style={{ minHeight: '100vh' }} />

const AppRouter: React.FC = () => (
  <Suspense fallback={routerFallback}>
    <RouterShell />
  </Suspense>
)

export default AppRouter
