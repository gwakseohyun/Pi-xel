
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async generatePixelArt(
    keyword: string, 
    themePrompt: string
  ): Promise<string | null> {
    // 매 호출마다 새로운 인스턴스를 생성하여 선택된 최신 API 키를 반영합니다.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = 'gemini-2.5-flash-image';

    const fullPrompt = `Task: Professional 2D pixel art of a literal "${keyword}".
STRICT TECHNICAL REQUIREMENTS:
1. BACKGROUND: Pure Magenta (#FF00FF) solid background.
2. SUBJECT: Solid, opaque inanimate object only. No faces/eyes.
3. OUTLINE: Clear black outline.
4. STYLE: ${themePrompt}.`;
    
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

      if (!response.candidates?.[0]?.content?.parts) throw new Error("EMPTY_RESPONSE");

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
