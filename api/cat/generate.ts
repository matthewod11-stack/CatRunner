import { generateCustomCatSprite } from '../../server/geminiGateway';

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

function toDescription(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 300);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = parseBody(req.body);
    const description = toDescription(body.description);
    if (!description) {
      res.status(400).json({ error: 'description is required' });
      return;
    }

    const imageDataUrl = await generateCustomCatSprite(description);
    res.status(200).json({ imageDataUrl });
  } catch (error) {
    console.error('[api/cat/generate]', error);
    res.status(500).json({ error: 'Server error' });
  }
}
