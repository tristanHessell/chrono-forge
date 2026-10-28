import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { saveCardPatterns, savedCardPatterns } from '../cardPatterns';
import cardPatternsToggleStyles from './CardPatternsToggle.module.css';

export function CardPatternsToggle() {
  const [enabled, setEnabled] = useState(savedCardPatterns);

  return (
    <label className={cardPatternsToggleStyles.cardPatternsChoice}>
      <FormattedMessage
        defaultMessage="Colour-independent backgrounds"
        id="patterns.label"
      />
      <input
        checked={enabled}
        onChange={(event) => {
          const next = event.target.checked;

          saveCardPatterns(next);
          setEnabled(next);
        }}
        type="checkbox"
      />
    </label>
  );
}
