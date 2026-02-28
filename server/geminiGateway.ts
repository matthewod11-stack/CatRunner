import { GoogleGenAI, Type } from '@google/genai';

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
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The player just scored ${score} points in "Beach Kitty". Generate exactly one short, sassy, or wise one-liner from the perspective of a white beach kitty. Keep it under 15 words.`,
    config: {
      temperature: 0.8,
      topP: 0.95,
      responseMimeType: 'application/json',
      responseSchema: messageSchema,
    },
  });

  return parseMessage(response.text, 'Stay pawsome!');
}

export async function generateDeathMessage(score: number): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The player died in "Beach Kitty" with a score of ${score}. Write exactly one funny or encouraging game-over message from a sarcastic white kitty.`,
    config: {
      temperature: 0.9,
      responseMimeType: 'application/json',
      responseSchema: messageSchema,
    },
  });

  return parseMessage(response.text, 'Curiosity did not kill the cat, that obstacle did.');
}

export async function generateCustomCatSprite(description: string): Promise<string | null> {
  const ai = getGeminiClient();
  const prompt = `A side-view full body character sprite of a kitty cat for a game.
The cat is ${description}.
Style: Bright 2D flat cartoon, high contrast, thick black outlines, facing right.
CRITICAL BACKGROUND REQUIREMENT: The background MUST be solid bright magenta/pink color (hex #FF00FF or similar hot pink).
This magenta background is essential - do not use white, gray, or any other background color.
No shadows on the floor, no grass, just the character on solid magenta/hot pink.
Center the character and ensure it fills the frame.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: { aspectRatio: '1:1' },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}
