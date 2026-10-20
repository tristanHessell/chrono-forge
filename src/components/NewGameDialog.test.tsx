import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { createDefaultPlayers } from '../playerSetup';
import { NewGameDialog } from './NewGameDialog';

it('starts with one human and one named computer', () => {
  const html = renderToStaticMarkup(
    <IntlProvider locale="en" messages={messages}>
      <NewGameDialog
        dialogRef={createRef()}
        initialPlayers={createDefaultPlayers()}
        onStart={() => {}}
      />
    </IntlProvider>,
  );

  expect(html).toContain('>You</strong>');
  expect(html).toContain('>Sally</strong>');
  expect(html).toContain('aria-label="You, human"');
  expect(html).toContain('aria-label="Sally, AI"');
  expect(html).toContain('<option value="computer" selected="">AI</option>');
  expect(html).toContain('>Add player</button>');
  expect(html).toContain('>Start game</button>');
  expect(html).not.toContain('Remove Sally');
});
