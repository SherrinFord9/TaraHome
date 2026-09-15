import {useEffect, useState} from 'react';
import {LandingPageReimagined} from './LandingPage';
import {initSiteAnalytics} from './analytics';

export function App({year}: {year: number}) {
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    return initSiteAnalytics();
  }, []);
  return <LandingPageReimagined darkMode={darkMode} setDarkMode={setDarkMode} ready={ready} year={year} />;
}
