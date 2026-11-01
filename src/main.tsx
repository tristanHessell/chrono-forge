import './styles/theme.css';
import './styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { initializeCardPatterns } from './cardPatterns';
import { initializeGameSettings } from './gameSettings';
import { GameIntlProvider } from './i18n/GameIntlProvider';
import { initializeTheme } from './theme';

initializeTheme();
initializeCardPatterns();
initializeGameSettings();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameIntlProvider>
      <App />
    </GameIntlProvider>
  </StrictMode>,
);
