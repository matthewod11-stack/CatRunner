import type { CatGenerateErrorCode, GenerateCatImageResult } from '../types/catGenerateApi';

/** Browser-safe defaults; allow `VITE_CAT_API_CLIENT_TIMEOUT_MS` (ms) to override all paths in dev/build. */
function clientFetchTimeoutMs(path: string): number {
  try {
    const raw = import.meta.env?.VITE_CAT_API_CLIENT_TIMEOUT_MS;
    if (raw !== undefined && raw !== '') {
      const n = parseInt(String(raw), 10);
      if (Number.isFinite(n) && n >= 5000) return n;
    }
  } catch {
    /* ignore */
  }
  if (path === '/api/cat/generate') {
    return 135_000;
  }
  return 55_000;
}

async function postCatApiJson(
  path: string,
  payload: unknown
): Promise<{ httpOk: boolean; status: number; data: Record<string, unknown> }> {
  const timeoutMs = clientFetchTimeoutMs(path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { httpOk: response.ok, status: response.status, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        httpOk: false,
        status: 408,
        data: {
          ok: false,
          code: 'REQUEST_TIMEOUT',
          message: 'Request timed out. Try again.',
        },
      };
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function getCatWisdom(score: number): Promise<string> {
  try {
    const { httpOk, data } = await postCatApiJson('/api/cat/wisdom', { score });
    if (!httpOk || data.ok === false) {
      return "Meow! Life's a beach.";
    }
    const message = data.message;
    return typeof message === 'string' && message.trim() ? message.trim() : 'Stay pawsome!';
  } catch (error) {
    console.error('Gemini API Error (wisdom):', error);
    return "Meow! Life's a beach.";
  }
}

export async function getDeathMessage(score: number): Promise<string> {
  try {
    const { httpOk, data } = await postCatApiJson('/api/cat/death-message', { score });
    if (!httpOk || data.ok === false) {
      return 'Ouch! Back to the litter box.';
    }
    const message = data.message;
    return typeof message === 'string' && message.trim()
      ? message.trim()
      : 'Curiosity did not kill the cat, that obstacle did.';
  } catch (error) {
    console.error('Gemini API Error (death message):', error);
    return 'Ouch! Back to the litter box.';
  }
}

function extractGenerateSuccess(data: Record<string, unknown>): GenerateCatImageResult | null {
  if (data.ok !== true || typeof data.imageDataUrl !== 'string') {
    return null;
  }
  const metaRaw = data.meta;
  const meta =
    metaRaw && typeof metaRaw === 'object'
      ? (metaRaw as Record<string, unknown>)
      : {};
  return {
    ok: true,
    imageDataUrl: data.imageDataUrl,
    meta: {
      promptVersion: typeof meta.promptVersion === 'string' ? meta.promptVersion : '',
      modelId: typeof meta.modelId === 'string' ? meta.modelId : '',
      durationMs: typeof meta.durationMs === 'number' ? meta.durationMs : 0,
      ...(meta.mattedOnServer === true ? { mattedOnServer: true as const } : {}),
    },
  };
}

export async function generateCustomCat(description: string): Promise<GenerateCatImageResult> {
  try {
    const { httpOk, status, data } = await postCatApiJson('/api/cat/generate', { description });

    const success = extractGenerateSuccess(data);
    if (success) {
      return success;
    }

    if (data.ok === false && typeof data.code === 'string' && typeof data.message === 'string') {
      return {
        ok: false,
        code: data.code as CatGenerateErrorCode,
        message: data.message,
      };
    }

    if (!httpOk) {
      return {
        ok: false,
        code: 'SERVER_ERROR',
        message: `Request failed (${status}). Try again.`,
      };
    }

    return {
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Unexpected response from the server. Try again.',
    };
  } catch (error) {
    console.error('Gemini API Error (image generation):', error);
    return {
      ok: false,
      code: 'API_ERROR',
      message: 'Could not reach the server. Check your connection and try again.',
    };
  }
}
