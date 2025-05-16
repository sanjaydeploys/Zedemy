import { Provider } from 'react-redux';
import store from './store';
import App from './App';
import React, { lazy, Suspense } from 'react';
import { hydrateRoot } from 'react-dom/client';

const ToastContainer = lazy(() => import('react-toastify').then(module => ({
  default: module.ToastContainer,
})));

import 'react-toastify/dist/ReactToastify.css';

const rootElement = document.getElementById('root');

if (rootElement.hasAttribute('data-hydration')) {
  const priorityContent = document.getElementById('priority-content');
  if (priorityContent?.innerHTML.trim() && priorityContent.querySelector('h1, img')) {
    console.log('[index] Valid SSR HTML found in #priority-content');
  } else {
    console.warn('[index] Invalid or empty #priority-content');
  }

  hydrateRoot(
    rootElement,
    <React.StrictMode>
      <Provider store={store}>
        <App />
        <Suspense fallback={null}>
          <ToastContainer />
        </Suspense>
      </Provider>
    </React.StrictMode>
  );
} else {
  console.log('[index] No SSR hydration; rendering client-side');
  hydrateRoot(
    rootElement,
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
