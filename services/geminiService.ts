interface MessageApiResponse {
  message?: string;
}

interface ImageApiResponse {
  imageDataUrl?: string | null;
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getCatWisdom(score: number): Promise<string> {
  try {
    const result = await postJson<MessageApiResponse>('/api/cat/wisdom', { score });
    return result.message?.trim() || 'Stay pawsome!';
  } catch (error) {
    console.error('Gemini API Error (wisdom):', error);
    return "Meow! Life's a beach.";
  }
}

export async function getDeathMessage(score: number): Promise<string> {
  try {
    const result = await postJson<MessageApiResponse>('/api/cat/death-message', { score });
    return result.message?.trim() || 'Curiosity did not kill the cat, that obstacle did.';
  } catch (error) {
    console.error('Gemini API Error (death message):', error);
    return 'Ouch! Back to the litter box.';
  }
}

export async function generateCustomCat(description: string): Promise<string | null> {
  try {
    const result = await postJson<ImageApiResponse>('/api/cat/generate', { description });
    return result.imageDataUrl || null;
  } catch (error) {
    console.error('Gemini API Error (image generation):', error);
    return null;
  }
}
