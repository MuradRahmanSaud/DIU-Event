import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent HMR and WebSocket proxy disconnects from causing visible unhandled rejections or runtime error overlays
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const msg = typeof reason === 'string' ? reason : (reason.message || '');
      if (
        msg.includes('WebSocket') || 
        msg.includes('websocket') || 
        msg.includes('closed without opened') ||
        msg.includes('connection')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('connection failed')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

