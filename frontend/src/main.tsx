import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
(window as any).__KW_VERSION = '1.5.0';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
