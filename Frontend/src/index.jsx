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

console.log('[index.jsx] Root element found:', !!rootElement);
console.log('[index.jsx] Data-hydration attribute:', rootElement?.hasAttribute('data-hydration'));
console.log('[index.jsx] Root innerHTML length:', rootElement?.innerHTML.length);
console.log('[index.jsx] Root innerHTML snippet (first 500 chars):', rootElement?.innerHTML.slice(0, 500));

if (rootElement.hasAttribute('data-hydration')) {
  console.log('[index.jsx] Hydrating SSR content');
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
  console.warn('[index.jsx] No SSR content detected, falling back to client-side rendering');
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
