
import { GoogleGenAI } from "@google/genai";

/**
 * 픽셀 아트를 생성하는 핵심 함수입니다.
 * 시스템의 process.env.API_KEY를 사용하여 보안을 유지하며 자동 연동됩니다.
 */
const generatePixelArtImage = async (keyword: string, themePrompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY가 설정되지 않았습니다. 관리자 설정을 확인해 주세요.");
  }

  const ai = new GoogleGenAI({ apiKey });
  // 고화질 이미지 생성을 위해 지정된 모델을 사용합니다.
  const model = 'gemini-2.5-flash-image';

  const prompt = `Create a 2D professional pixel art asset of a "${keyword}".
STYLE: ${themePrompt}.
REQUIREMENTS:
1. BACKGROUND: MUST be a flat solid Magenta (#FF00FF).
2. PERSPECTIVE: Flat 2D view.
3. OUTLINE: Clear black borders.
4. QUALITY: Sharp pixels, strictly 2D.`;

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
      throw new Error("이미지 생성 응답이 없습니다.");
    }

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "API 연결 실패");
  }
};

export default generatePixelArtImage;
