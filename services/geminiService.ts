
import { GoogleGenAI } from "@google/genai";

/**
 * 픽셀 아트를 생성하는 핵심 서비스 함수입니다.
 * 시스템 주입 키(process.env.API_KEY)를 사용하여 보안을 유지하며 작동합니다.
 */
export const generatePixelArtImage = async (keyword: string, themePrompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API 키가 설정되지 않았습니다.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash-image';

  const prompt = `Create a 2D professional pixel art asset of a "${keyword}".
STYLE: ${themePrompt}.
REQUIREMENTS:
1. BACKGROUND: MUST be a flat solid Magenta (#FF00FF).
2. PERSPECTIVE: Flat 2D view.
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
    throw new Error(error.message || "이미지 생성 도중 오류가 발생했습니다.");
  }
};
