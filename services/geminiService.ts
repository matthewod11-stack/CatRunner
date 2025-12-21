
import { GoogleGenAI, Type } from "@google/genai";

const messageSchema = {
  type: Type.OBJECT,
  properties: {
    message: {
      type: Type.STRING,
      description: "A single, short string containing the cat's message.",
    },
  },
  required: ["message"],
};

export async function getCatWisdom(score: number): Promise<string> {
  try {
    // Instantiate ai inside the function to use the most recent process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The player just scored ${score} points in 'Beach Cat Runner'. Generate exactly one short, sassy, or wise one-liner from the perspective of a white beach kitty. Keep it under 15 words.`,
      config: {
        temperature: 0.8,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: messageSchema,
      },
    });
    
    const result = JSON.parse(response.text || "{}");
    return result.message || "Stay pawsome!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Meow! Life's a beach.";
  }
}

export async function getDeathMessage(score: number): Promise<string> {
  try {
    // Instantiate ai inside the function to use the most recent process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The player died in 'Beach Cat Runner' with a score of ${score}. Write exactly one funny or encouraging "Game Over" message from a sarcastic white kitty. No lists, no options, just the final message.`,
      config: {
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: messageSchema,
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result.message || "Curiosity didn't kill the cat, that obstacle did!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ouch! Back to the litter box.";
  }
}

export async function generateCustomCat(description: string): Promise<string | null> {
  try {
    // Instantiate ai inside the function to use the most recent process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A side-view full body character sprite of a kitty cat for a game. 
    The cat is ${description}. 
    Style: Bright 2D flat cartoon, high contrast, thick black outlines, facing right. 
    Crucial: Must be isolated on a plain, solid, pure #FFFFFF white background. 
    No shadows on the floor, no grass, just the character. 
    Center the character and ensure it fills the frame.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
}
