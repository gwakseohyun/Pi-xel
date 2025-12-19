
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async generatePixelArt(
    keyword: string, 
    themePrompt: string
  ): Promise<string | null> {
    // Guidelines: Use process.env.API_KEY directly and instantiate inside the call
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key must be set when running in a browser. Please check your key configuration.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-2.5-flash-image as requested for high-performance generation
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
        throw new Error("The API returned an empty result. This might be a safety filter block.");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("No image data found in response.");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
