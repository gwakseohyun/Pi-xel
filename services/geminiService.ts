
import { GoogleGenAI } from "@google/genai";

/**
 * 픽셀 아트를 생성하는 핵심 엔진입니다.
 * 사용자님이 요청하신 대로, 사용자의 개입 없이 시스템 환경 변수를 직접 활용합니다.
 */
export const generatePixelArtImage = async (keyword: string, themePrompt: string): Promise<string> => {
  // 시스템에서 주입하는 API_KEY를 사용합니다.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("환경 변수(API_KEY)가 설정되지 않았습니다. 서비스 관리자에게 문의하세요.");
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
      throw new Error("이미지를 생성할 수 없습니다. 다른 키워드로 시도해 보세요.");
    }

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // 실제 에러 메시지를 사용자에게 전달하여 투명한 상태 확인을 돕습니다.
    throw new Error(error.message || "API 연결 중 오류가 발생했습니다.");
  }
};
