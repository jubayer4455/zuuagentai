export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    name: "👑 রাস্তার রাজা (Rastar Raja) API",
    status: "online",
    creator: "Abdul Al Jubayer",
    version: "3.2.0",
    endpoints: [
      "/api/board",
      "/api/run",
      "/api/score",
      "/api/name",
      "/api/subscribe"
    ]
  });
}
