
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async generatePixelArt(
    keyword: string, 
    themePrompt: string
  ): Promise<string | null> {
    // 호출 시점에 환경 변수에서 키를 직접 가져옵니다.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API_KEY_NOT_FOUND");
    }

    const ai = new GoogleGenAI({ apiKey });
    // 사용자의 요청대로 무료 티어에서 안정적인 gemini-2.5-flash-image 모델을 사용합니다.
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
        throw new Error("SAFETY_OR_EMPTY");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("NO_IMAGE_DATA");
    } catch (error: any) {
      console.error("Gemini SDK Detailed Error:", error);
      // 서버 에러 메시지에 따른 세분화된 에러 처리
      const msg = error.message || String(error);
      if (msg.includes("401") || msg.includes("API key not valid")) {
        throw new Error("INVALID_API_KEY");
      } else if (msg.includes("404") || msg.includes("not found")) {
        throw new Error("MODEL_OR_PROJECT_NOT_FOUND");
      } else if (msg.includes("429")) {
        throw new Error("RATE_LIMIT_EXCEEDED");
      }
      throw error;
    }
  }
}
