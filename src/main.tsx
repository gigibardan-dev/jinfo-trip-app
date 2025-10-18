import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker, checkOnlineStatus } from './registerServiceWorker';

// Register service worker for PWA offline support
registerServiceWorker();

// Monitor online/offline status
checkOnlineStatus();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
