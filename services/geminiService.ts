
import { GoogleGenAI } from "@google/genai";

/**
 * 픽셀 아트를 생성하는 핵심 서비스 함수입니다.
 * 사용자님이 강조하신 대로, 별도의 키 입력 없이 시스템 환경 변수를 즉시 사용합니다.
 */
export const generatePixelArtImage = async (keyword: string, themePrompt: string): Promise<string> => {
  // 지침에 따라 process.env.API_KEY를 직접 사용합니다.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const model = 'gemini-2.5-flash-image';

  const prompt = `Create a 2D professional pixel art asset of a "${keyword}".
STYLE: ${themePrompt}.
REQUIREMENTS:
1. BACKGROUND: MUST be a flat solid Magenta (#FF00FF).
2. PERSPECTIVE: Flat 2D view (side or top).
3. OUTLINE: Clear black borders.
4. QUALITY: Sharp pixels, no blur.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData) {
      throw new Error("이미지 생성에 실패했습니다. (응답 데이터 없음)");
    }

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error: any) {
    // 서버에서 전달된 실제 에러 메시지를 그대로 던져서 화면에 노출합니다.
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "알 수 없는 API 오류가 발생했습니다.");
  }
};
