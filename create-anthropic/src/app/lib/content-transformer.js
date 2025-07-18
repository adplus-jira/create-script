import { GoogleGenAI } from '@google/genai';
import { createMessage } from './anthropic-client';
import { TRANSFORM_SYSTEM_PROMPT } from './prompts';

export const transformKeyContent = async (
  originalContent
) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  })
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: TRANSFORM_SYSTEM_PROMPT,
        temperature: 1,
        thinkingConfig: {
          thinkingBudget: 1000,
        },
      },
      contents: originalContent,
    });

    const response = result.text?.trim() || result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    // const response = await createMessage({
    //   model,
    //   max_tokens: 2000,
    //   temperature: 0.9,
    //   messages: [{ role: 'user', content: transformPrompt }],
    // });

    // return response.content[0].text;
    return response;
  } catch (error) {
    console.error('Transform error:', error);
    throw error;
  }
};

export const generateMainContent = async (params) => {
  const { system, model, userMsg, top_p, top_k } = params;
  
  try {
    const response = await createMessage({
      system,
      model,
      top_p: parseInt(top_p) || 0.9,
      top_k: parseInt(top_k) || 60,
      max_tokens: 20000,
      messages: [{ role: 'user', content: userMsg }],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('내용 변경 실패!', error);
    throw error;
  }
};