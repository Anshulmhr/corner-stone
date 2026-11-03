import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeDemoProfile } from './services/storage.js';

let demoStorageUnavailable = false;
try {
  initializeDemoProfile();
} catch {
  demoStorageUnavailable = true;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {demoStorageUnavailable ? (
      <main role="alert">Demo storage is unavailable in this browser. <a href="./">Return to personal practice</a>.</main>
    ) : <App />}
  </React.StrictMode>
);
