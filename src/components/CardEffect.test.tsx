// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { expect, it } from 'vitest';

import messages from '../i18n/en.json';
import { CardEffect } from './CardEffect';

it('shows effect icons without hover tooltips', () => {
  const { container } = render(
    <IntlProvider locale="en" messages={messages}>
      <CardEffect effect="draw-one" />
    </IntlProvider>,
  );

  expect(screen.getByRole('img', { name: 'Draw one card' })).toBeTruthy();
  expect(container.querySelector('[role="tooltip"]')).toBeNull();
  expect(container.querySelector('[data-tooltip-enabled]')).toBeNull();
});

it('shows the free action label', () => {
  render(
    <IntlProvider locale="en" messages={messages}>
      <CardEffect effect="free-action" />
    </IntlProvider>,
  );

  expect(screen.getByRole('img', { name: 'Free action' })).toBeTruthy();
});
