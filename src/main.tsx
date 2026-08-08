import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import { ContentProvider } from './context/ContentContext';
import './index.css';

// Default to warm theme across the site
document.documentElement.classList.remove('theme-default', 'theme-dark');
document.documentElement.classList.add('theme-warm');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <ContentProvider>
        <App />
      </ContentProvider>
    </AppProvider>
  </React.StrictMode>,
);
