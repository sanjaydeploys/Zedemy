import { Provider } from 'react-redux';
import store from './store';
import App from './App';
import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

// Lazy load ToastContainer
const ToastContainer = lazy(() => import('react-toastify').then(module => ({
  default: module.ToastContainer,
})));

import 'react-toastify/dist/ReactToastify.css'; // Consider dynamic import for CSS if possible

const rootElement = document.getElementById('root');
const appRoot = createRoot(rootElement);

appRoot.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Suspense fallback={null}>
        <ToastContainer />
      </Suspense>
    </Provider>
  </React.StrictMode>
);
