// The file was created by Ahmed Al-Makhatreh.

// codeguard:components:start
// codeguard:defines: module-local implementation below
import { StrictMode as StrictModeRef, Suspense as SuspenseRef, lazy as lazyRef } from 'react'
import { createRoot as createRootRef } from 'react-dom/client'
import './index.css'
import { isAdminHost as onAdminHost } from './admin/adminHost.js'
import { ErrorBoundary as ErrorBoundaryRef } from './components/ErrorBoundary/ErrorBoundary'

const RootApp = import.meta.env.DEV && onAdminHost(window.location.hostname, true)
  ? lazyRef(() => import('./admin/AdminApp.jsx'))
  : lazyRef(() => import('./App.jsx'))
const RootAppRef = RootApp;
// codeguard:components:end

createRootRef(document.getElementById('root')).render(
  <StrictModeRef>
    <ErrorBoundaryRef><SuspenseRef fallback={<div role="status" aria-label="Loading" />}>
      <RootAppRef />
    </SuspenseRef></ErrorBoundaryRef>
  </StrictModeRef>,
)
