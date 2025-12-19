
import { GoogleGenAI } from "@google/genai";

/**
 * 픽셀 아트를 생성하는 핵심 엔진입니다.
 * 시스템 환경 변수(process.env.API_KEY)를 직접 사용하여 사용자의 개입 없이 작동합니다.
 */
export const generatePixelArtImage = async (keyword: string, themePrompt: string): Promise<string> => {
  // 시스템 주입 키 사용
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY 환경 변수가 설정되지 않았습니다.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash-image';

  const prompt = `Create a 2D professional pixel art asset of a "${keyword}".
STYLE: ${themePrompt}.
REQUIREMENTS:
1. BACKGROUND: MUST be a flat solid Magenta (#FF00FF).
2. PERSPECTIVE: Flat 2D view (side or top).
3. OUTLINE: Clear black borders.
4. QUALITY: Sharp pixels, no blur.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData) {
      throw new Error("이미지 생성 결과가 없습니다. 다시 시도해 주세요.");
    }

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "API 호출 중 오류가 발생했습니다.");
  }
};
