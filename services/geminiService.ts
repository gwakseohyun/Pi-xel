
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async generatePixelArt(
    keyword: string, 
    themePrompt: string
  ): Promise<string | null> {
    // 시스템에서 제공하는 API_KEY를 직접 사용합니다.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("환경 변수(API_KEY)를 찾을 수 없습니다. 설정 상태를 확인해주세요.");
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
        throw new Error("모델 응답이 없습니다. (Safety filter 등으로 차단되었을 수 있습니다)");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("응답에 이미지 데이터가 포함되어 있지 않습니다.");
    } catch (error: any) {
      console.error("Gemini API Raw Error:", error);
      throw error; 
    }
  }
}
