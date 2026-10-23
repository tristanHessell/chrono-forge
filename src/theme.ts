export type Theme = 'light' | 'dark' | 'greyscale-light' | 'greyscale-dark';

export const storageKey = 'card-table-theme';

export function parseTheme(value: unknown): Theme | null {
  if (value === 'grayscale' || value === 'greyscale') {
    return 'greyscale-dark';
  }

  return value === 'light' ||
    value === 'dark' ||
    value === 'greyscale-light' ||
    value === 'greyscale-dark'
    ? value
    : null;
}

export function saveTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // The theme still works when browser storage is unavailable.
  }
}

export function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey);

    return parseTheme(value);
  } catch {
    return null;
  }
}

export function initializeTheme() {
  const theme =
    savedTheme() ??
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  document.documentElement.dataset.theme = theme;

  return theme;
}
