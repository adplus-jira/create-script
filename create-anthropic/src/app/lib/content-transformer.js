import { createMessage } from './anthropic-client';
import { getTransformPrompt } from './prompts';

export const transformKeyContent = async (
  originalContent,
  character,
  approach,
  model = 'claude-3-haiku-20240307'
) => {
  const transformPrompt = getTransformPrompt(originalContent);
  
  try {
    const response = await createMessage({
      model,
      max_tokens: 2000,
      temperature: 0.9,
      messages: [{ role: 'user', content: transformPrompt }],
    });

    return response.content[0].text;
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