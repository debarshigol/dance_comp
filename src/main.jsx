import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CompetitionProvider } from './context/CompetitionContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <CompetitionProvider>
        <App />
      </CompetitionProvider>
    </ThemeProvider>
  </React.StrictMode>
);
