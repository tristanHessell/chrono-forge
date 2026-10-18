import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { GameIntlProvider } from './i18n/GameIntlProvider';
import { initializeTheme } from './theme';

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameIntlProvider>
      <App />
    </GameIntlProvider>
  </StrictMode>,
);
