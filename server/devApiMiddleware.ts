import type { IncomingMessage, ServerResponse } from 'node:http';
import { generateCatWisdom, generateDeathMessage, generateCustomCatSprite } from './geminiGateway';

type NextFn = () => void;

function toScore(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

function toDescription(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, 300);
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function createDevApiMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: NextFn) => {
    const pathname = req.url ? new URL(req.url, 'http://localhost').pathname : '';
    if (req.method !== 'POST' || !pathname.startsWith('/api/cat/')) {
      next();
      return;
    }

    const body = await readJsonBody(req);

    try {
      if (pathname === '/api/cat/wisdom') {
        const message = await generateCatWisdom(toScore(body.score));
        sendJson(res, 200, { message });
        return;
      }

      if (pathname === '/api/cat/death-message') {
        const message = await generateDeathMessage(toScore(body.score));
        sendJson(res, 200, { message });
        return;
      }

      if (pathname === '/api/cat/generate') {
        const description = toDescription(body.description);
        if (!description) {
          sendJson(res, 400, { error: 'description is required' });
          return;
        }

        const imageDataUrl = await generateCustomCatSprite(description);
        sendJson(res, 200, { imageDataUrl });
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      console.error('[local-gemini-api]', error);
      sendJson(res, 500, { error: 'Server error' });
    }
  };
}
