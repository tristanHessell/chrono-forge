import { createRef } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

import { render } from '../../tests/render';
import messages from '../i18n/en.json';
import { SettingsDialog } from './SettingsDialog';

describe(SettingsDialog, () => {
  afterEach(() => {
    localStorage.removeItem('card-table-arrows');
    localStorage.removeItem('card-table-arrow-animation');
  });

  it('shows and saves the arrow settings and version', async () => {
    const dialogRef = createRef<HTMLDialogElement>();

    render(
      <IntlProvider locale="en" messages={messages}>
        <SettingsDialog dialogRef={dialogRef} />
      </IntlProvider>,
    );
    dialogRef.current?.showModal();

    const arrows = page.getByRole('checkbox', { name: 'Show arrows' });
    const animateArrows = page.getByRole('checkbox', {
      name: 'Animate arrows in the direction they point',
    });

    await expect.element(arrows).toBeChecked();
    await expect.element(animateArrows).not.toBeChecked();
    await expect.element(page.getByText('Version 0.1.0')).toBeInTheDocument();

    await arrows.click();
    await animateArrows.click();

    expect(document.documentElement.dataset.arrows).toBe('off');
    expect(document.documentElement.dataset.arrowAnimation).toBe('on');
    expect(localStorage.getItem('card-table-arrows')).toBe('off');
    expect(localStorage.getItem('card-table-arrow-animation')).toBe('on');
  });
});
