import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import {ConfiguratorPage} from '../app/components/ConfiguratorPage';
import {initSiteAnalytics} from '../app/components/analytics';

function ConfiguratorApp() {
  const [darkMode, setDarkModeState] = useState(() => {
    try {
      return window.localStorage.getItem('tara-theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => initSiteAnalytics(), []);

  useEffect(() => {
    delete document.documentElement.dataset.taraTheme;
  }, []);

  const setDarkMode = (value: boolean) => {
    setDarkModeState(value);
    try {
      window.localStorage.setItem('tara-theme', value ? 'dark' : 'light');
    } catch {
      // Theme persistence should not block the planner.
    }
  };

  return <ConfiguratorPage darkMode={darkMode} setDarkMode={setDarkMode} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfiguratorApp />
  </React.StrictMode>,
);
