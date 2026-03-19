import { GoogleGenAI, Type, FinishReason, type GenerateContentResponse } from '@google/genai';
import { buildCustomCatSpritePrompt, CUSTOM_CAT_SPRITE_PROMPT_VERSION } from './prompts/customCatSprite';
import type { CatGenerateErrorCode } from '../types/catGenerateApi';

const messageSchema = {
  type: Type.OBJECT,
  properties: {
    message: {
      type: Type.STRING,
      description: 'A single, short string containing the cat message.',
    },
  },
  required: ['message'],
};

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({ apiKey });
}

function parseMessage(text: string | undefined, fallback: string): string {
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text) as { message?: string };
    const message = parsed.message?.trim();
    return message ? message : fallback;
  } catch {
    return fallback;
  }
}

export async function generateCatWisdom(score: number): Promise<string> {
  const ai = getGeminiClient();
  const response = await withGeminiTimeout(
    ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player just scored ${score} points in "Beach Kitty". Generate exactly one short, sassy, or wise one-liner from the perspective of a white beach kitty. Keep it under 15 words.`,
      config: {
        temperature: 0.8,
        topP: 0.95,
        responseMimeType: 'application/json',
        responseSchema: messageSchema,
      },
    }),
    GEMINI_TEXT_TIMEOUT_MS,
    'wisdom'
  );

  return parseMessage(response.text, 'Stay pawsome!');
}

export async function generateDeathMessage(score: number): Promise<string> {
  const ai = getGeminiClient();
  const response = await withGeminiTimeout(
    ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player died in "Beach Kitty" with a score of ${score}. Write exactly one funny or encouraging game-over message from a sarcastic white kitty.`,
      config: {
        temperature: 0.9,
        responseMimeType: 'application/json',
        responseSchema: messageSchema,
      },
    }),
    GEMINI_TEXT_TIMEOUT_MS,
    'death'
  );

  return parseMessage(response.text, 'Curiosity did not kill the cat, that obstacle did.');
}

const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';

function getGeminiImageModel(): string {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_GEMINI_IMAGE_MODEL;
}

const BLOCKED_IMAGE_FINISH = new Set<string>([
  FinishReason.SAFETY,
  FinishReason.RECITATION,
  FinishReason.BLOCKLIST,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.SPII,
  FinishReason.IMAGE_SAFETY,
  FinishReason.IMAGE_PROHIBITED_CONTENT,
  FinishReason.MALFORMED_FUNCTION_CALL,
  FinishReason.UNEXPECTED_TOOL_CALL,
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Server-side wait for Gemini SDK calls (does not cancel in-flight HTTP). */
export const GEMINI_TEXT_TIMEOUT_MS = (() => {
  const n = parseInt(process.env.GEMINI_TEXT_TIMEOUT_MS || '', 10);
  return Number.isFinite(n) && n >= 5000 ? n : 45_000;
})();

export const GEMINI_IMAGE_TIMEOUT_MS = (() => {
  const n = parseInt(process.env.GEMINI_IMAGE_TIMEOUT_MS || '', 10);
  return Number.isFinite(n) && n >= 10_000 ? n : 120_000;
})();

async function withGeminiTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) {
    return promise;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`GEMINI_REQUEST_TIMEOUT:${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function isMissingApiKeyError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('GEMINI_API_KEY');
}

export type CustomCatSpriteGenResult =
  | {
      ok: true;
      dataUrl: string;
      durationMs: number;
      modelId: string;
      promptVersion: string;
    }
  | {
      ok: false;
      code: CatGenerateErrorCode;
      message: string;
      finishReason?: string;
      blockReason?: string;
    };

function resultFromImageResponse(
  response: GenerateContentResponse,
  modelId: string,
  durationMs: number
): CustomCatSpriteGenResult {
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) {
    return {
      ok: false,
      code: 'PROMPT_BLOCKED',
      message: 'This description could not be used for image generation.',
      blockReason: String(blockReason),
    };
  }

  const candidate = response.candidates?.[0];
  const finishReason = candidate?.finishReason;

  for (const part of candidate?.content?.parts || []) {
    if (part.inlineData?.data) {
      return {
        ok: true,
        dataUrl: `data:image/png;base64,${part.inlineData.data}`,
        durationMs,
        modelId,
        promptVersion: CUSTOM_CAT_SPRITE_PROMPT_VERSION,
      };
    }
  }

  if (finishReason === FinishReason.NO_IMAGE) {
    return {
      ok: false,
      code: 'NO_IMAGE',
      message: 'The model did not produce an image. Try a simpler description.',
      finishReason: String(finishReason),
    };
  }

  if (finishReason && BLOCKED_IMAGE_FINISH.has(finishReason)) {
    return {
      ok: false,
      code: 'MODEL_BLOCKED',
      message: 'Image generation was blocked by safety filters. Try rephrasing your description.',
      finishReason: String(finishReason),
    };
  }

  if (!response.candidates?.length) {
    return {
      ok: false,
      code: 'NO_IMAGE',
      message: 'No image was returned. Try again.',
    };
  }

  return {
    ok: false,
    code: 'NO_IMAGE',
    message: 'No image data in the response. Try again.',
    finishReason: finishReason ? String(finishReason) : undefined,
  };
}

async function generateCustomCatSpriteOnce(description: string): Promise<GenerateContentResponse> {
  const ai = getGeminiClient();
  const modelId = getGeminiImageModel();
  const prompt = buildCustomCatSpritePrompt(description);

  return withGeminiTimeout(
    ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: { aspectRatio: '1:1' },
      },
    }),
    GEMINI_IMAGE_TIMEOUT_MS,
    'image'
  );
}

export async function generateCustomCatSprite(description: string): Promise<CustomCatSpriteGenResult> {
  const modelId = getGeminiImageModel();
  const t0 = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await generateCustomCatSpriteOnce(description);
      const durationMs = Date.now() - t0;
      return resultFromImageResponse(response, modelId, durationMs);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('GEMINI_REQUEST_TIMEOUT:')) {
        return {
          ok: false,
          code: 'REQUEST_TIMEOUT',
          message: 'Image generation took too long. Try again with a simpler description.',
        };
      }
      if (isMissingApiKeyError(err)) {
        return {
          ok: false,
          code: 'CONFIG_ERROR',
          message: 'AI features are not configured on the server.',
        };
      }
      lastError = err;
      if (attempt === 0) {
        await sleep(450);
      }
    }
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  console.error('[geminiGateway] generateCustomCatSprite failed after retry:', lastError);
  return {
    ok: false,
    code: 'API_ERROR',
    message: msg.includes('fetch') || msg.includes('network')
      ? 'Network error talking to the image service. Try again.'
      : 'Image generation failed. Try again in a moment.',
  };
}
