import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedWordData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const lookupWord = async (word: string, theme: string = "General"): Promise<GeneratedWordData> => {
  const modelId = "gemini-2.5-flash";
  
  const prompt = `Explain the English word: "${word}" for a Vietnamese learner.
  Context/Theme: "${theme}".
  Provide the output strictly in JSON format with the following fields:
  - pronunciation (IPA format)
  - meaning (Vietnamese meaning relevant to the theme)
  - explanation (Short explanation in Vietnamese)
  - example (A simple English example sentence containing the word, relevant to the theme "${theme}")`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pronunciation: { type: Type.STRING },
            meaning: { type: Type.STRING },
            explanation: { type: Type.STRING },
            example: { type: Type.STRING },
          },
          required: ["pronunciation", "meaning", "explanation", "example"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeneratedWordData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
