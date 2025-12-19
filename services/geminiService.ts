
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async generatePixelArt(
    keyword: string, 
    themePrompt: string
  ): Promise<string | null> {
    // API 호출 직전에 최신 API 키를 환경 변수에서 가져옵니다.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API_KEY_MISSING: 환경 변수에서 API 키를 찾을 수 없습니다.");
    }

    // 매 호출마다 새로운 인스턴스를 생성하여 키 업데이트에 대응합니다.
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
        throw new Error("API_RESPONSE_EMPTY: 모델로부터 응답을 받지 못했습니다. (안전 필터 가능성)");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("NO_IMAGE_PART: 응답에 이미지 데이터가 포함되어 있지 않습니다.");
    } catch (error: any) {
      // 가공하지 않은 실제 에러를 콘솔과 상위로 던집니다.
      console.error("Gemini API Raw Error:", error);
      throw error; 
    }
  }
}
