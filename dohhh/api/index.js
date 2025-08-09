export default function handler(req, res) {
  res.status(200).json({
    message: "Medusa API",
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
}