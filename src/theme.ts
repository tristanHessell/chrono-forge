export type Theme = 'light' | 'dark';

export const storageKey = 'card-table-theme';

export function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey);

    return value === 'light' || value === 'dark' ? value : null;
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
