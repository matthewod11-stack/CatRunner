import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  handleCatWisdom,
  handleCatDeathMessage,
  handleCatGenerate,
} from './catApiHandlers';
import {
  getCatApiClientIdFromIncoming,
  isCatApiRateLimited,
  readCatApiJsonBodyBounded,
} from './catApiProtection';

type NextFn = () => void;

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

    const clientId = getCatApiClientIdFromIncoming(req);

    try {
      if (pathname === '/api/cat/wisdom') {
        if (isCatApiRateLimited(clientId, 'wisdom')) {
          sendJson(res, 429, {
            ok: false,
            code: 'RATE_LIMITED',
            message: 'Too many requests. Wait a moment and try again.',
          });
          return;
        }
        const read = await readCatApiJsonBodyBounded(req);
        if (read.ok === false) {
          sendJson(res, read.status, read.payload);
          return;
        }
        const { status, body: payload } = await handleCatWisdom(read.body);
        sendJson(res, status, payload);
        return;
      }

      if (pathname === '/api/cat/death-message') {
        if (isCatApiRateLimited(clientId, 'death')) {
          sendJson(res, 429, {
            ok: false,
            code: 'RATE_LIMITED',
            message: 'Too many requests. Wait a moment and try again.',
          });
          return;
        }
        const read = await readCatApiJsonBodyBounded(req);
        if (read.ok === false) {
          sendJson(res, read.status, read.payload);
          return;
        }
        const { status, body: payload } = await handleCatDeathMessage(read.body);
        sendJson(res, status, payload);
        return;
      }

      if (pathname === '/api/cat/generate') {
        if (isCatApiRateLimited(clientId, 'generate')) {
          sendJson(res, 429, {
            ok: false,
            code: 'RATE_LIMITED',
            message: 'Too many cat generations. Try again in a minute.',
          });
          return;
        }
        const read = await readCatApiJsonBodyBounded(req);
        if (read.ok === false) {
          sendJson(res, read.status, read.payload);
          return;
        }
        const { status, body: payload } = await handleCatGenerate(read.body);
        sendJson(res, status, payload);
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
      console.error('[local-gemini-api]', error);
      sendJson(res, 500, { ok: false, code: 'SERVER_ERROR', message: 'Server error' });
    }
  };
}
