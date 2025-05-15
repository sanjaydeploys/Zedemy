import { Provider } from 'react-redux';
import store from './store';
import App from './App';
import React, { lazy, Suspense } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

const ToastContainer = lazy(() => import('react-toastify').then(module => ({
  default: module.ToastContainer,
})));

import 'react-toastify/dist/ReactToastify.css';

const rootElement = document.getElementById('root');
const sidebarElement = document.getElementById('sidebar');
const nonCriticalElement = document.getElementById('non-critical-content');
const priorityContent = document.getElementById('priority-content');

if (rootElement.hasAttribute('data-hydration')) {
  // Validate SSR HTML
  if (priorityContent?.innerHTML.trim() && priorityContent.querySelector('h1, img')) {
    console.log('[index] Valid SSR HTML found in #priority-content');
  } else {
    console.warn('[index] #priority-content is empty or invalid; relying on client-side SSR fetch');
  }

  // Hydrate non-critical components
  if (sidebarElement) {
    hydrateRoot(
      sidebarElement,
      <Provider store={store}>
        <Suspense fallback={<div style={{ height: '600px', background: '#e0e0e0', borderRadius: '0.375rem', width: '100%' }} />}>
          <App hydrateTarget="sidebar" />
        </Suspense>
      </Provider>
    );
  }
  if (nonCriticalElement) {
    hydrateRoot(
      nonCriticalElement,
      <Provider store={store}>
        <Suspense fallback={<div style={{ height: '200px', background: '#e0e0e0', borderRadius: '0.375rem', width: '100%' }} />}>
          <App hydrateTarget="non-critical" />
        </Suspense>
      </Provider>
    );
  }

  // Load PostPage chunk with retry
  const loadChunk = (attempt = 1, maxAttempts = 3) => {
    fetch('/manifest.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(manifest => {
        const postChunk = manifest['src/components/PostPage.jsx']?.file;
        if (postChunk) {
          const script = document.createElement('script');
          script.src = `/${postChunk}`;
          script.async = true;
          script.defer = true;
          script.onerror = () => {
            console.error(`[index] Failed to load post chunk: ${postChunk}, attempt ${attempt}`);
            if (attempt < maxAttempts) {
              setTimeout(() => loadChunk(attempt + 1, maxAttempts), 1000);
            }
          };
          script.onload = () => console.log('[index] PostPage chunk loaded:', postChunk);
          document.body.appendChild(script);
        } else {
          console.error('[index] PostPage chunk not found in manifest');
        }
      })
      .catch(err => {
        console.error('[index] Failed to load manifest:', err.message);
        if (attempt < maxAttempts) {
          setTimeout(() => loadChunk(attempt + 1, maxAttempts), 1000);
        }
      });
  };

  loadChunk();
} else {
  createRoot(rootElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
        <Suspense fallback={null}>
          <ToastContainer />
        </Suspense>
      </Provider>
    </React.StrictMode>
  );
}
