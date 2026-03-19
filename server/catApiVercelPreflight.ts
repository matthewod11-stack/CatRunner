import type { IncomingHttpHeaders } from 'node:http';
import { parseCatApiBody } from './catApiBody';
import {
  getCatApiClientId,
  isCatApiBodyTooLarge,
  isCatApiRateLimited,
} from './catApiProtection';
import type { CatGenerateErrorCode } from '../types/catGenerateApi';

export type CatApiVercelRouteKind = 'generate' | 'wisdom' | 'death';

type PreflightOk = { ok: true; body: Record<string, unknown> };
type PreflightErr = {
  ok: false;
  status: number;
  payload: { ok: false; code: CatGenerateErrorCode; message: string };
};

const rateLimitMessage: Record<CatApiVercelRouteKind, string> = {
  generate: 'Too many cat generations. Try again in a minute.',
  wisdom: 'Too many requests. Wait a moment and try again.',
  death: 'Too many requests. Wait a moment and try again.',
};

/**
 * Rate limit + body size + JSON parse for Vercel serverless routes (`req.body` is already parsed).
 */
export function runCatApiVercelPreflight(
  headers: IncomingHttpHeaders | undefined,
  rawBody: unknown,
  kind: CatApiVercelRouteKind
): PreflightOk | PreflightErr {
  const clientId = getCatApiClientId(headers);
  const rateKind = kind === 'generate' ? 'generate' : kind;
  if (isCatApiRateLimited(clientId, rateKind)) {
    return {
      ok: false,
      status: 429,
      payload: {
        ok: false,
        code: 'RATE_LIMITED',
        message: rateLimitMessage[kind],
      },
    };
  }

  if (isCatApiBodyTooLarge(rawBody)) {
    return {
      ok: false,
      status: 413,
      payload: {
        ok: false,
        code: 'BAD_REQUEST',
        message: 'Request body too large.',
      },
    };
  }

  return { ok: true, body: parseCatApiBody(rawBody) };
}
