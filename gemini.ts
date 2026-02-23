import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeDream = async (content: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Ты — эксперт по психоанализу и толкованию сновидений. 
Проанализируй это сновидение с символической и психологической точки зрения. 
Дай глубокое представление о возможных значениях и эмоциональных подтекстах. 

ВАЖНО: Весь ответ должен быть СТРОГО на русском языке. Не используй английский язык в заголовках или пояснениях.
Ответ оформи в красивом формате Markdown.

Сон: ${content}`,
  });
  return response.text;
};

export const generateDreamImage = async (content: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          text: `Сюрреалистичная, эфирная и художественная визуализация следующего сна: ${content}. Стиль должен быть живописным, атмосферным и слегка абстрактным, как воспоминание или видение. Без текста на изображении.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
