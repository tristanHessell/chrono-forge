// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { createDefaultPlayers } from '../playerSetup';
import { NewGameDialog } from './NewGameDialog';

it('starts with one human and one named computer', () => {
  const dialogRef = createRef<HTMLDialogElement>();

  render(
    <IntlProvider locale="en" messages={messages}>
      <NewGameDialog
        dialogRef={dialogRef}
        initialPlayers={createDefaultPlayers()}
        onStart={() => {}}
      />
    </IntlProvider>,
  );

  dialogRef.current?.showModal();

  expect(screen.getByText('You', { selector: 'strong' })).toBeTruthy();
  expect(screen.getByText('Sally', { selector: 'strong' })).toBeTruthy();
  expect(screen.getByLabelText('You, human')).toBeTruthy();
  expect(screen.getByLabelText('Sally, AI')).toBeTruthy();
  expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe(
    'computer',
  );
  expect(screen.getByRole('button', { name: 'Add player' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Start game' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Remove Sally' })).toBeNull();
});
