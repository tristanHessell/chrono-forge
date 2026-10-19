import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { initializeCardPatterns } from './cardPatterns';
import { GameIntlProvider } from './i18n/GameIntlProvider';
import { initializeTheme } from './theme';

initializeTheme();
initializeCardPatterns();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameIntlProvider>
      <App />
    </GameIntlProvider>
  </StrictMode>,
);
