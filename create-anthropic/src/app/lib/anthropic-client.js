import Anthropic from '@anthropic-ai/sdk';

let anthropicClient = null;

export const getAnthropicClient = () => {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
};

export const createMessage = async (params) => {
  const client = getAnthropicClient();
  return await client.messages.create(params);
};