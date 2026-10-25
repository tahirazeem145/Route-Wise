/**
 * Anonymous User Key Utility
 * Generates and stores a pseudonymous UUID in localStorage for voting and anti-abuse deduplication.
 * Does not collect personal data, email, or user location trails.
 */

const USER_KEY_STORAGE = 'routewise_anonymous_user_key';

export function getAnonymousUserKey() {
  if (typeof window === 'undefined') {
    return 'usr_server_render';
  }

  let key = localStorage.getItem(USER_KEY_STORAGE);
  if (!key) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      key = `usr_${crypto.randomUUID()}`;
    } else {
      key = `usr_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    }
    localStorage.setItem(USER_KEY_STORAGE, key);
  }
  return key;
}
