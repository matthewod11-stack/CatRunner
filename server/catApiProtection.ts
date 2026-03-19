/**
 * Shared guards for POST /api/cat/* (Vite dev middleware + Vercel routes).
 * Tune via env in production; defaults are safe for single-player + light abuse.
 */

import type { IncomingHttpHeaders, IncomingMessage } from 'node:http';

export const CAT_API_MAX_BODY_BYTES = (() => {
  const n = parseInt(process.env.CAT_API_MAX_BODY_BYTES || '', 10);
  return Number.isFinite(n) && n > 256 ? n : 32_768;
})();

const RATE_WINDOW_MS = 60_000;

function rateLimitPerMinute(envKey: string, fallback: number): number {
  const n = parseInt(process.env[envKey] || '', 10);
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

/** Max successful checks per window per client id (image generation is expensive). */
export const CAT_API_RATE_GENERATE_PER_MIN = rateLimitPerMinute('CAT_API_RATE_GENERATE_PER_MIN', 8);

/** Max per window for wisdom + death-message (lighter calls). */
export const CAT_API_RATE_TEXT_PER_MIN = rateLimitPerMinute('CAT_API_RATE_TEXT_PER_MIN', 40);

export type CatApiTextRouteKind = 'wisdom' | 'death';

const rateBuckets = new Map<string, number[]>();

function pruneBucket(ts: number[], now: number): number[] {
  return ts.filter((t) => now - t < RATE_WINDOW_MS);
}

/**
 * Returns true if the request should be rejected (rate limited).
 */
export function isCatApiRateLimited(clientId: string, kind: 'generate' | CatApiTextRouteKind): boolean {
  const limit =
    kind === 'generate' ? CAT_API_RATE_GENERATE_PER_MIN : CAT_API_RATE_TEXT_PER_MIN;
  const key = `${kind}:${clientId}`;
  const now = Date.now();
  const prev = rateBuckets.get(key) ?? [];
  const pruned = pruneBucket(prev, now);
  if (pruned.length >= limit) {
    rateBuckets.set(key, pruned);
    return true;
  }
  pruned.push(now);
  rateBuckets.set(key, pruned);
  return false;
}

/** Best-effort client key for per-IP limits (dev + Vercel). */
export function getCatApiClientId(headers: IncomingHttpHeaders | undefined): string {
  if (!headers) return 'unknown';
  const xf = headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) {
    return xf.split(',')[0]!.trim().slice(0, 128) || 'unknown';
  }
  if (Array.isArray(xf) && xf[0]) {
    return String(xf[0]).split(',')[0]!.trim().slice(0, 128) || 'unknown';
  }
  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim().slice(0, 128);
  if (Array.isArray(realIp) && realIp[0]) return String(realIp[0]).trim().slice(0, 128);
  return 'unknown';
}

export function getCatApiClientIdFromIncoming(req: IncomingMessage): string {
  const fromHeaders = getCatApiClientId(req.headers);
  if (fromHeaders !== 'unknown') return fromHeaders;
  return (req.socket?.remoteAddress ?? 'unknown').slice(0, 128);
}

export function catApiJsonByteLength(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
  } catch {
    return CAT_API_MAX_BODY_BYTES + 1;
  }
}

export function isCatApiBodyTooLarge(parsedBody: unknown): boolean {
  return catApiJsonByteLength(parsedBody) > CAT_API_MAX_BODY_BYTES;
}

type ReadBodyOk = { ok: true; body: Record<string, unknown> };
type ReadBodyErr = { ok: false; status: number; payload: Record<string, unknown> };

/**
 * Reads JSON from a Node request stream with a hard byte cap (dev middleware).
 */
export async function readCatApiJsonBodyBounded(req: IncomingMessage): Promise<ReadBodyOk | ReadBodyErr> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > CAT_API_MAX_BODY_BYTES) {
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
    chunks.push(buf);
  }

  if (chunks.length === 0) {
    return { ok: true, body: {} };
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        ok: false,
        status: 400,
        payload: {
          ok: false,
          code: 'BAD_REQUEST',
          message: 'JSON body must be an object.',
        },
      };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      status: 400,
      payload: {
        ok: false,
        code: 'BAD_REQUEST',
        message: 'Invalid JSON body.',
      },
    };
  }
}
