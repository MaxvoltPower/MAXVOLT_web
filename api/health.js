export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(200).json({
    ok: true,
    service: 'maxvolt-api',
    time: new Date().toISOString(),
  });
}