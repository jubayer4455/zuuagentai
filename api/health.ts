export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'healthy',
    platform: 'ZUU AI Studio',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
}
