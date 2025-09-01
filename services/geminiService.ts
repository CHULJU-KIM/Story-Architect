import { GoogleGenAI, Modality, Type, GenerateContentResponse, Part } from "@google/genai";
import type { FinalStory } from './types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. This will likely fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY_HERE" });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result); // Return the full data URL
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } => {
    const parts = dataUrl.split(',');
    const metaPart = parts[0];
    const dataPart = parts[1];
    
    if (!metaPart || !dataPart) {
        throw new Error("Invalid data URL format");
    }

    const mimeType = metaPart.split(';')[0].split(':')[1];
    if (!mimeType) {
        throw new Error("Could not extract MIME type from data URL");
    }
    
    return { mimeType, data: dataPart };
}

export const generateImageForScene = async (prompt: string, previousImageDataUrl?: string | null): Promise<string> => {
  try {
    if (previousImageDataUrl) {
      // IMAGE-TO-IMAGE: Use NanoBanana for continuity and editing
      const { mimeType, data } = parseDataUrl(previousImageDataUrl);
      const parts: Part[] = [
        { inlineData: { data, mimeType } },
        { text: `This is a scene from a story. Generate the very next moment based on the following description. It is crucial to maintain the artistic style, characters, and atmosphere of the provided image to ensure visual continuity. Description: ${prompt}` }
      ];

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          // Nano-banana doesn't specify mime type in response, assume PNG.
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("AI가 이미지를 반환하지 않았습니다. 안전 가이드라인에 위배되었거나 프롬프트가 모호할 수 있습니다.");

    } else {
      // TEXT-TO-IMAGE: Use Imagen for initial generation
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `Create a cinematic, high-quality, and emotionally resonant image for a story based on this description: ${prompt}`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
      }
      throw new Error("AI가 이미지를 생성하지 못했습니다. 프롬프트를 좀 더 자세하게 수정해보세요.");
    }
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error && error.message.includes('429')) {
       throw new Error("API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
    }
    throw new Error(`이미지 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

export const finalizeStory = async (concept: string, sceneDescriptions: string[]): Promise<FinalStory> => {
    const prompt = `
        사용자가 제공한 스토리 컨셉과 아마추어적인 장면 묘사들을 바탕으로, 전문가 수준의 완성된 단편 소설을 만들어주세요.

        1. 전체 이야기를 아우르는 창의적인 '제목'을 만드세요.
        2. 모든 장면을 자연스럽게 연결하여, 문학적 표현이 풍부한 '전체 스토리'를 작성하세요.
        3. 각 장면의 원본 묘사를 슬라이드쇼 캡션에 어울리는 아름답고 생생한 '전문가 묘사'로 각각 재작성해주세요. (결과물은 반드시 원본 장면 순서와 동일해야 합니다.)
        4. 이야기의 분위기에 가장 잘 어울리는 '음악'을 추천해주세요.

        모든 응답은 한국어로 작성해야 합니다.

        스토리 컨셉: "${concept}"

        사용자의 원본 장면 묘사:
        ${sceneDescriptions.map((d, i) => `장면 #${i + 1}: ${d}`).join('\n')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { 
                            type: Type.STRING,
                            description: '생성된 이야기의 창의적인 제목.'
                        },
                        fullText: { 
                            type: Type.STRING,
                            description: '장면들을 엮어 만든 완성된 이야기. 여러 문단으로 구성.'
                        },
                        musicRecommendation: { 
                            type: Type.STRING,
                            description: '이야기의 분위기와 어울리는 음악 장르 또는 테마 추천.'
                        },
                        polishedScenes: {
                            type: Type.ARRAY,
                            description: '사용자의 원본 묘사를 전문가 수준으로 다듬은 각 장면의 설명 목록.',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.INTEGER, description: '장면의 원래 순서 번호 (1부터 시작).' },
                                    description: { type: Type.STRING, description: '전문적으로 다듬어진 장면 묘사.' }
                                },
                                required: ["id", "description"]
                            }
                        }
                    },
                    required: ["title", "fullText", "musicRecommendation", "polishedScenes"]
                },
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as FinalStory;
    } catch (error) {
        console.error("Error finalizing story:", error);
        throw new Error("스토리 요약 및 음악 추천 생성에 실패했습니다.");
    }
};