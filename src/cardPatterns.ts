export const cardPatternsStorageKey = 'card-table-patterns';

export function savedCardPatterns (): boolean {
  try {
    return localStorage.getItem(cardPatternsStorageKey) === 'on';
  } catch {
    return true;
  }
}

export function saveCardPatterns (enabled: boolean) {
  const value = enabled ? 'on' : 'off';

  document.documentElement.dataset.cardPatterns = value;
  try {
    localStorage.setItem(cardPatternsStorageKey, value);
  } catch {
    // The setting still works when browser storage is unavailable.
  }
}

export function initializeCardPatterns () {
  document.documentElement.dataset.cardPatterns = savedCardPatterns()
    ? 'on'
    : 'off';
}
