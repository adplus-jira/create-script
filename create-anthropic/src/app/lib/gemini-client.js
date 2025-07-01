import { GoogleGenAI } from '@google/genai';

const generateGemini = async () => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    
  })
}