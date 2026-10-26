import { createRef } from 'react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { createDefaultPlayers } from '../playerSetup';
import { NewGameDialog } from './NewGameDialog';

it('starts with one human and one named computer', async () => {
  render(
    <IntlProvider locale="en" messages={messages}>
      <NewGameDialog
        dialogRef={createRef()}
        initialPlayers={createDefaultPlayers()}
        onStart={() => {}}
      />
    </IntlProvider>,
  );

  expect(page.getByText('You', { exact: true }).length).toBe(1);
  expect(page.getByText('Sally', { exact: true }).length).toBe(1);
  expect(page.getByLabelText('You, human').length).toBe(1);
  expect(page.getByLabelText('Sally, AI').length).toBe(1);
  await expect.element(page.getByCSS('select')).toHaveValue('computer');
  expect(page.getByCSS('button').filter({ hasText: 'Add player' }).length).toBe(
    1,
  );
  expect(page.getByCSS('button').filter({ hasText: 'Start game' }).length).toBe(
    1,
  );
  expect(page.getByText('Remove Sally').length).toBe(0);
});
