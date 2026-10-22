import { useState } from 'react';
import { useIntl } from 'react-intl';

import { saveCardPatterns, savedCardPatterns } from '../cardPatterns';
import cardPatternsToggleStyles from './CardPatternsToggle.module.css';

export function CardPatternsToggle() {
  const intl = useIntl();
  const [enabled, setEnabled] = useState(savedCardPatterns);

  return (
    <label className={cardPatternsToggleStyles.cardPatternsChoice}>
      {intl.formatMessage({
        id: 'patterns.label',
        defaultMessage: 'Colour-independent backgrounds',
      })}
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          const next = event.target.checked;

          saveCardPatterns(next);
          setEnabled(next);
        }}
      />
    </label>
  );
}
