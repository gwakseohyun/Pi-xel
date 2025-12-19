
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async generatePixelArt(
    keyword: string, 
    themePrompt: string, 
    isHighQuality: boolean = false
  ): Promise<string | null> {
    // process.env.API_KEY에 안전하게 접근합니다.
    // 브라우저 환경에서는 직접 접근이 제한될 수 있으므로 undefined 체크를 강화합니다.
    let apiKey: string | undefined;
    
    try {
      apiKey = process.env.API_KEY;
    } catch (e) {
      apiKey = undefined;
    }
    
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }

    // 호출 시점에 인스턴스를 생성하여 주입된 최신 키를 사용합니다.
    const ai = new GoogleGenAI({ apiKey });
    
    const modelName = isHighQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const fullPrompt = `Task: Professional 2D pixel art of a literal "${keyword}".

STRICT TECHNICAL REQUIREMENTS:
1. BACKGROUND: The background MUST be a single, solid, flat color of PURE MAGENTA (Hex: #FF00FF). 
2. NO MAGENTA INSIDE: Ensure no magenta (#FF00FF) pixels are used inside the subject.
3. SUBJECT INTEGRITY: The subject must be a single, solid, fully opaque inanimate object. NO eyes, NO faces, NO limbs.
4. OUTLINE: The subject MUST have a clear, thick, solid black outline (2 pixels wide).
5. NO GLOW: Strictly NO anti-aliasing, NO bloom, NO soft edges.
6. NO CONTAINERS: No circles, no badges, no frames.

Style focus: ${themePrompt}. Provide a sharp, iconic representation.`;
    
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: fullPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            ...(isHighQuality ? { imageSize: "1K" } : {})
          }
        }
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No image generated");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      return null;
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      // 키가 유효하지 않거나 권한이 없는 경우의 에러 처리
      if (error.message?.includes("not found") || error.message?.includes("API key") || error.message?.includes("403")) {
        throw new Error("API_KEY_INVALID");
      }
      throw error;
    }
  }
}
