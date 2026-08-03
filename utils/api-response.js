export function ok(res, data, extra = {}) {
  return res.status(200).json({
    data,
    ...extra,
  });
}

export function created(res, data, extra = {}) {
  return res.status(201).json({
    data,
    ...extra,
  });
}

export function noContent(res) {
  return res.status(204).end();
}
