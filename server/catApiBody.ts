/** Shared JSON body parsing for /api/cat/* (Vercel + Vite middleware). */
export function parseCatApiBody(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

export function catApiToScore(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

const DESCRIPTION_MAX_LEN = 300;

export function catApiToDescription(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, DESCRIPTION_MAX_LEN);
}
