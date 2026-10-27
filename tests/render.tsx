import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach } from 'vitest';
import type { Locator } from 'vitest/browser';
import { locators } from 'vitest/browser';

declare module 'vitest/browser' {
  interface LocatorSelectors {
    getByCSS: (selector: string) => Locator;
  }
}

locators.extend({
  getByCSS(selector) {
    return `css=${selector}`;
  },
});

const roots: Root[] = [];

export function render(element: ReactNode) {
  const container = document.createElement('div');

  document.body.append(container);

  const root = createRoot(container);

  roots.push(root);

  // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- TODO explain why this is necessary
  flushSync(() => {
    root.render(element);
  });
}

afterEach(() => {
  // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- TODO explain why this is necessary
  flushSync(() => {
    for (const root of roots) {
      root.unmount();
    }
  });

  roots.length = 0;
  document.body.replaceChildren();
});
