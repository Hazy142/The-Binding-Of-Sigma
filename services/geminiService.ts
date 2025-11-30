import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateItemDescription = async (itemName: string, itemEffect: string): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "No internet? That's kinda cringe. (API Key missing)";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a Gen Alpha video game announcer. Write a VERY short (max 10 words), funny description using harsh Gen Alpha slang (Skibidi, Rizz, Ohio, Sigma, Fanum Tax, Cap, Bet, Glazing, etc.) for a game item named "${itemName}". Effect: ${itemEffect}. Don't explain the effect, just hype it up or meme it.`,
      config: {
        maxOutputTokens: 50,
        temperature: 1.2,
      }
    });
    return response.text?.trim() || "Poggers item (AI broke)";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The Wi-Fi is tweaking. No description.";
  }
};

export const generateBossTaunt = async (): Promise<string> => {
  const ai = getClient();
  if (!ai) return "I'm gonna tax your health!";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Write a short (1 sentence) taunt from a video game boss using Gen Alpha slang. He is threatening the player.",
    });
    return response.text?.trim() || "You're cooked, lil bro!";
  } catch (error) {
    return "You're cooked, lil bro!";
  }
};