import { handleCatWisdom } from '../../server/catApiHandlers';
import { runCatApiVercelPreflight } from '../../server/catApiVercelPreflight';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const pre = runCatApiVercelPreflight(req.headers, req.body, 'wisdom');
  if (pre.ok === false) {
    res.status(pre.status).json(pre.payload);
    return;
  }

  const { status, body: payload } = await handleCatWisdom(pre.body);
  res.status(status).json(payload);
}
