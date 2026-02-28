import { generateCatWisdom } from '../../server/geminiGateway';

function parseBody(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof body === 'object') return body as Record<string, unknown>;
  return {};
}

function toScore(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = parseBody(req.body);
    const message = await generateCatWisdom(toScore(body.score));
    res.status(200).json({ message });
  } catch (error) {
    console.error('[api/cat/wisdom]', error);
    res.status(500).json({ error: 'Server error' });
  }
}
