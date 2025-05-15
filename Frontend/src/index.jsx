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

if (rootElement.hasAttribute('data-hydration')) {
  // Progressive hydration for non-critical components
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
  // Validate priority-content
  const priorityContent = document.getElementById('priority-content');
  if (!priorityContent?.innerHTML.trim() || !priorityContent.querySelector('h1, img')) {
    console.warn('[index] #priority-content is empty or invalid; relying on client-side SSR fetch');
  } else {
    console.log('[index] #priority-content contains valid SSR HTML');
  }
  // Load main script using manifest
  fetch('/manifest.json')
    .then(res => res.json())
    .then(manifest => {
      const postChunk = manifest['src/components/PostPage.jsx']?.file;
      if (postChunk) {
        const script = document.createElement('script');
        script.src = `/${postChunk}`;
        script.async = true;
        script.defer = true;
        script.onerror = () => console.error(`[index] Failed to load post chunk: ${postChunk}`);
        document.body.appendChild(script);
      } else {
        console.error('[index] PostPage chunk not found in manifest');
      }
    })
    .catch(err => console.error('[index] Failed to load manifest:', err.message));
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
