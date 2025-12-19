
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async generatePixelArt(
    keyword: string, 
    themePrompt: string
  ): Promise<string | null> {
    const apiKey = process.env.API_KEY;
    
    // We only throw here if there's absolutely no key available after the UI attempt.
    if (!apiKey) {
      throw new Error("API Key not found. Please select a key when the dialog appears.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = 'gemini-2.5-flash-image';

    const fullPrompt = `Create a 2D professional pixel art asset of a "${keyword}".
STYLE: ${themePrompt}.
REQUIREMENTS:
1. BACKGROUND: MUST be a flat solid Magenta (#FF00FF).
2. PERSPECTIVE: Flat 2D view (side or top).
3. OUTLINE: Clear black borders.
4. QUALITY: Sharp pixels, no blur.`;
    
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [{ text: fullPrompt }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("Empty response from API (likely a safety filter block).");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("No image part found in the AI response.");
    } catch (error: any) {
      console.error("Gemini SDK Error:", error);
      throw error;
    }
  }
}
