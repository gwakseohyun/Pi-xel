
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  // 호출 시점에 외부에서 검증된 키를 전달받습니다.
  async generatePixelArt(
    apiKey: string,
    keyword: string, 
    themePrompt: string
  ): Promise<string | null> {
    if (!apiKey) {
      throw new Error("API 키가 제공되지 않았습니다.");
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
        throw new Error("모델 응답이 비어있습니다. (Safety filter 등)");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("응답에서 이미지 데이터를 찾을 수 없습니다.");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error; 
    }
  }
}
