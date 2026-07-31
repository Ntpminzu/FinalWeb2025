export function safeReferrer(req, fallback = '/') {
  const referrer = req.get('Referrer');
  if (!referrer) return fallback;
  try {
    const target = new URL(referrer, `${req.protocol}://${req.get('host')}`);
    if (target.host !== req.get('host')) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
