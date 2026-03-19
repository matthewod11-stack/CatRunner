# `/api/cat/*` protection model

Beach Kitty proxies Gemini through same-origin POST routes. **Phase 2 (ROADMAP V2)** added baseline guards suitable for a small game; tune for production traffic.

## What is enforced

| Layer | Behavior |
|-------|------------|
| **Body size** | JSON body capped (`CAT_API_MAX_BODY_BYTES`, default 32 KiB). Dev middleware reads streams with a hard cap; Vercel checks parsed `req.body` serialized size. |
| **Rate limits** | Per-client sliding window (1 minute). Separate budgets for **generate** vs **wisdom** / **death-message**. |
| **Client fetch** | `fetch` uses `AbortController` timeouts (135s generate, 55s text). Optional override: `VITE_CAT_API_CLIENT_TIMEOUT_MS` in `.env` for the Vite client bundle. |
| **Server Gemini** | `Promise.race` timeouts around SDK calls (`GEMINI_TEXT_TIMEOUT_MS`, `GEMINI_IMAGE_TIMEOUT_MS`). Does not cancel in-flight HTTP. |
| **Generate prompt** | User description is sanitized and wrapped in delimiters; instructions discourage treating user text as system overrides (`server/prompts/customCatSprite.ts`). |

## Environment variables

| Variable | Default | Notes |
|----------|---------|--------|
| `CAT_API_MAX_BODY_BYTES` | `32768` | Increase only if needed. |
| `CAT_API_RATE_GENERATE_PER_MIN` | `8` | Per client id per minute. |
| `CAT_API_RATE_TEXT_PER_MIN` | `40` | Per client id per minute **per route** (`/wisdom` and `/death-message` each have their own counter). |
| `GEMINI_TEXT_TIMEOUT_MS` | `45000` | Server text generation. |
| `GEMINI_IMAGE_TIMEOUT_MS` | `120000` | Server image generation. |
| `VITE_CAT_API_CLIENT_TIMEOUT_MS` | _(path defaults)_ | Optional single timeout for all browser `fetch` calls to `/api/cat/*`. |

Client id is derived from `x-forwarded-for` (first hop), then `x-real-ip`, then (dev only) `socket.remoteAddress`. **Many users behind one NAT share a bucket** — for serious production, add Vercel Edge middleware, Redis, or authenticated quotas.

## Local vs deployed

- **Local dev:** In-memory rate limits reset on server restart; one machine / few testers.
- **Deployed (Vercel serverless):** Each cold start resets in-memory counters — limits are **best-effort**, not a hard global cap. Acceptable for cost/abuse baseline; upgrade to shared store if you see abuse.

## Error codes

Structured JSON errors use `ok: false` and `code` where applicable: `RATE_LIMITED`, `REQUEST_TIMEOUT`, `BAD_REQUEST`, existing generate codes (`PROMPT_BLOCKED`, `NO_IMAGE`, etc.).
