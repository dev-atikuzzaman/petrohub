import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './lib/ThemeContext';
import { TypographyProvider } from './lib/TypographyContext';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <TypographyProvider>
        <App />
      </TypographyProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('✅ PWA Service Worker registered'))
      .catch(err => console.log('⚠️ Service Worker registration failed:', err));
  });
}

reportWebVitals();
