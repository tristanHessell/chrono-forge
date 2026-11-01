export const arrowsStorageKey = 'card-table-arrows';
export const arrowAnimationStorageKey = 'card-table-arrow-animation';

function savedPreference(key: string, defaultValue: boolean) {
  try {
    const value = localStorage.getItem(key);

    return value === 'on' || (value !== 'off' && defaultValue);
  } catch {
    return defaultValue;
  }
}

function savePreference(key: string, enabled: boolean) {
  try {
    localStorage.setItem(key, enabled ? 'on' : 'off');
  } catch {
    // The setting still works when browser storage is unavailable.
  }
}

export function savedArrows() {
  return savedPreference(arrowsStorageKey, true);
}

export function savedArrowAnimation() {
  return savedPreference(arrowAnimationStorageKey, false);
}

export function saveArrows(enabled: boolean) {
  document.documentElement.dataset.arrows = enabled ? 'on' : 'off';
  savePreference(arrowsStorageKey, enabled);
}

export function saveArrowAnimation(enabled: boolean) {
  document.documentElement.dataset.arrowAnimation = enabled ? 'on' : 'off';
  savePreference(arrowAnimationStorageKey, enabled);
}

export function initializeGameSettings() {
  document.documentElement.dataset.arrows = savedArrows() ? 'on' : 'off';
  document.documentElement.dataset.arrowAnimation = savedArrowAnimation()
    ? 'on'
    : 'off';
}
