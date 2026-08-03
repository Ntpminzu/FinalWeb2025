export function ok(res, data, extra = {}) {
  return res.status(200).json({
    data,
    ...extra,
  });
}
