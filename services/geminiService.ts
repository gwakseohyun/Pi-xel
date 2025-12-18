
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generatePixelArt(keyword: string, themePrompt: string): Promise<string | null> {
    // 마젠타(#FF00FF)는 투명도 처리를 위한 전통적인 크로마키 색상으로, 피사체와 배경의 구분을 극대화합니다.
    const fullPrompt = `Task: Professional 2D pixel art of "${keyword}".

STRICT TECHNICAL REQUIREMENTS:
1. BACKGROUND: The background MUST be a single, solid, flat color of PURE MAGENTA (Hex: #FF00FF). No exceptions.
2. NO MAGENTA INSIDE: Do not use magenta (#FF00FF) anywhere within the subject itself.
3. SUBJECT INTEGRITY: The subject must be a single, solid, fully opaque object in the exact center. No personification (no eyes/limbs) unless requested.
4. OUTLINE: The subject MUST have a thick, continuous, solid DARK outline (at least 1-2 pixels wide) to completely seal the interior from the background.
5. NO GLOW/BLOOM: No glowing effects, no semi-transparent "light" pixels, and no anti-aliasing. Every pixel must be a solid color block.
6. NO CONTAINERS: No circles, no badges, no frames, no ground shadows. Just the object on a flat magenta field.

Style focus: ${themePrompt}. Ensure a clean, sharp, iconic look.`;
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: fullPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
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
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}
