// codeguard:components:start
// codeguard:defines: module-local implementation below
import { StrictMode as StrictModeRef } from 'react';
import { createRoot as createRootRef } from 'react-dom/client';
import '../index.css';
import AdminApp from './AdminApp.jsx';
import { ErrorBoundary as ErrorBoundaryRef } from '../components/ErrorBoundary/ErrorBoundary';
// codeguard:components:end

createRootRef(document.getElementById('root')).render(
  <StrictModeRef><ErrorBoundaryRef language="ar"><AdminApp /></ErrorBoundaryRef></StrictModeRef>,
);
