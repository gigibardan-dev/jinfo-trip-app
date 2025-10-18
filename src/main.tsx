import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Service worker registration temporarily disabled for debugging
// import { registerServiceWorker, checkOnlineStatus } from './registerServiceWorker'
// registerServiceWorker();
// checkOnlineStatus();

createRoot(document.getElementById("root")!).render(<App />);
