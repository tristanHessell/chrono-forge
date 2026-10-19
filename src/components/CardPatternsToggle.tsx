import { useState } from 'react';

import { saveCardPatterns, savedCardPatterns } from '../cardPatterns';
import { useMessages } from '../i18n/useMessages';
import cardPatternsToggleStyles from './CardPatternsToggle.module.css';

export function CardPatternsToggle() {
  const t = useMessages();
  const [enabled, setEnabled] = useState(savedCardPatterns);

  return (
    <label className={cardPatternsToggleStyles.cardPatternsChoice}>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          const next = event.target.checked;

          saveCardPatterns(next);
          setEnabled(next);
        }}
      />
      {t('patterns.label')}
    </label>
  );
}
