import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// নোট: Service Worker রেজিস্ট্রেশন এখন public/index.html-এ সরানো হয়েছে,
// যাতে এই bundle crash করলেও (যেমন কোনো module import-এর সময় error) PWA
// installability অক্ষত থাকে।

reportWebVitals();
