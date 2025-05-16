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
