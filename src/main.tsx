import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent libraries from trying to overwrite window.fetch
if (typeof window !== 'undefined') {
  const _fetch = window.fetch;
  try {
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get: () => _fetch,
      set: () => {
        console.warn('GeoClock: Prevented library from overwriting window.fetch');
      }
    });
  } catch (e) {
    console.warn('Could not lock window.fetch');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
