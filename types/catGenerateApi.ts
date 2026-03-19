/** Shared contract for POST /api/cat/generate (server + client). */

export type CatGenerateErrorCode =
  | 'BAD_REQUEST'
  | 'CONFIG_ERROR'
  | 'NO_IMAGE'
  | 'MODEL_BLOCKED'
  | 'PROMPT_BLOCKED'
  | 'API_ERROR'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'REQUEST_TIMEOUT';

export type CatGenerateSuccessJson = {
  ok: true;
  imageDataUrl: string;
  meta: {
    promptVersion: string;
    modelId: string;
    durationMs: number;
    /** True when PNG was processed with server-side matting (same algorithm as client). */
    mattedOnServer?: boolean;
  };
};

export type CatGenerateErrorJson = {
  ok: false;
  code: CatGenerateErrorCode;
  message: string;
  finishReason?: string;
  blockReason?: string;
};

export type CatGenerateJson = CatGenerateSuccessJson | CatGenerateErrorJson;

export type GenerateCatImageResult =
  | {
      ok: true;
      imageDataUrl: string;
      meta: CatGenerateSuccessJson['meta'];
    }
  | {
      ok: false;
      code: CatGenerateErrorCode;
      message: string;
    };
