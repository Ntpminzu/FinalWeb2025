const guestKey = 'academy.guest-cart';
export function readGuestIds(storage = localStorage) {
  try {
    const ids = JSON.parse(storage.getItem(guestKey) || '[]');
    return Array.isArray(ids)
      ? [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0 && id <= 2147483647))].slice(
          0,
          100,
        )
      : [];
  } catch {
    return [];
  }
}
export function writeGuestIds(ids, storage = localStorage) {
  storage.setItem(guestKey, JSON.stringify([...new Set(ids)]));
}
export function checkoutAttempt(userId, ids, storage = sessionStorage) {
  const key = `academy.checkout.${userId}`;
  const fingerprint = [...ids].sort((a, b) => a - b).join(',');
  try {
    const previous = JSON.parse(storage.getItem(key) || 'null');
    if (previous?.fingerprint === fingerprint && typeof previous.idempotencyKey === 'string')
      return previous;
  } catch {
    /* A corrupt draft must not block a new checkout. */
  }
  const attempt = { fingerprint, idempotencyKey: crypto.randomUUID(), courseIds: [...ids] };
  storage.setItem(key, JSON.stringify(attempt));
  return attempt;
}
