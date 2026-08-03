export function health(req, res) {
  return res.status(200).json({
    data: {
      status: 'consong nhe',
      service: 'online-academy',
      timestamp: new Date().toISOString(),
    },
  });
}
