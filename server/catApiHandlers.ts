import { generateCatWisdom, generateDeathMessage, generateCustomCatSprite } from './geminiGateway';
import { catApiToDescription, catApiToScore } from './catApiBody';
import type { CatGenerateJson } from '../types/catGenerateApi';
import { tryMatPngDataUrlServer } from './matCustomCatSprite';

export type CatApiHandlerResult = { status: number; body: unknown };

function isConfigError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('GEMINI_API_KEY');
}

function isGeminiTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('GEMINI_REQUEST_TIMEOUT:');
}

export async function handleCatWisdom(body: Record<string, unknown>): Promise<CatApiHandlerResult> {
  try {
    const message = await generateCatWisdom(catApiToScore(body.score));
    return { status: 200, body: { message } };
  } catch (error) {
    console.error('[catApi/wisdom]', error);
    if (isGeminiTimeoutError(error)) {
      return {
        status: 504,
        body: {
          ok: false,
          code: 'REQUEST_TIMEOUT',
          message: 'The AI request took too long. Try again.',
        },
      };
    }
    if (isConfigError(error)) {
      return {
        status: 503,
        body: { ok: false, code: 'CONFIG_ERROR', message: 'AI features are not configured on the server.' },
      };
    }
    return { status: 500, body: { ok: false, code: 'SERVER_ERROR', message: 'Server error' } };
  }
}

export async function handleCatDeathMessage(body: Record<string, unknown>): Promise<CatApiHandlerResult> {
  try {
    const message = await generateDeathMessage(catApiToScore(body.score));
    return { status: 200, body: { message } };
  } catch (error) {
    console.error('[catApi/death-message]', error);
    if (isGeminiTimeoutError(error)) {
      return {
        status: 504,
        body: {
          ok: false,
          code: 'REQUEST_TIMEOUT',
          message: 'The AI request took too long. Try again.',
        },
      };
    }
    if (isConfigError(error)) {
      return {
        status: 503,
        body: { ok: false, code: 'CONFIG_ERROR', message: 'AI features are not configured on the server.' },
      };
    }
    return { status: 500, body: { ok: false, code: 'SERVER_ERROR', message: 'Server error' } };
  }
}

export async function handleCatGenerate(body: Record<string, unknown>): Promise<CatApiHandlerResult> {
  const description = catApiToDescription(body.description);
  if (!description) {
    const err: CatGenerateJson = {
      ok: false,
      code: 'BAD_REQUEST',
      message: 'description is required',
    };
    return { status: 400, body: err };
  }

  try {
    const result = await generateCustomCatSprite(description);
    if (result.ok === false) {
      const errBody: CatGenerateJson = {
        ok: false,
        code: result.code,
        message: result.message,
        finishReason: result.finishReason,
        blockReason: result.blockReason,
      };

      const status =
        result.code === 'BAD_REQUEST'
          ? 400
          : result.code === 'CONFIG_ERROR'
            ? 503
            : result.code === 'PROMPT_BLOCKED' || result.code === 'MODEL_BLOCKED'
              ? 422
              : result.code === 'NO_IMAGE'
                ? 502
                : result.code === 'API_ERROR'
                  ? 502
                  : result.code === 'REQUEST_TIMEOUT'
                    ? 504
                    : result.code === 'RATE_LIMITED'
                      ? 429
                      : 500;

      return { status, body: errBody };
    }

    const mattedUrl = await tryMatPngDataUrlServer(result.dataUrl);
    console.info('[catApi/generate]', {
      ok: true,
      promptVersion: result.promptVersion,
      modelId: result.modelId,
      durationMs: result.durationMs,
      mattedOnServer: mattedUrl !== result.dataUrl,
    });
    const ok: CatGenerateJson = {
      ok: true,
      imageDataUrl: mattedUrl,
      meta: {
        promptVersion: result.promptVersion,
        modelId: result.modelId,
        durationMs: result.durationMs,
        mattedOnServer: mattedUrl !== result.dataUrl,
      },
    };
    return { status: 200, body: ok };
  } catch (error) {
    console.error('[catApi/generate]', error);
    if (isConfigError(error)) {
      const err: CatGenerateJson = {
        ok: false,
        code: 'CONFIG_ERROR',
        message: 'AI features are not configured on the server.',
      };
      return { status: 503, body: err };
    }
    const err: CatGenerateJson = {
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Server error',
    };
    return { status: 500, body: err };
  }
}
