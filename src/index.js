import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import telemetryService from './services/telemetryService';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Start performance metrics collection and reporting
reportWebVitals();

// Cleanup telemetry on page unload
window.addEventListener('beforeunload', () => {
  telemetryService.stop();
});
