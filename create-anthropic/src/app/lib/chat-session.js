import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "./prompts";

let chat = null;

function extractTextFromGeminiResponse(response) {
  const parts = response?.candidates?.flatMap(candidate => candidate?.content?.parts || []) || [];
  const textParts = parts
    .map(part => part?.text)
    .filter(text => typeof text === "string" && text.length > 0);

  return textParts.join("");
}

export const initChatSession = async (systemPrompt) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  chat = ai.chats.create({
    model: "gemini-3.1-flash-lite-preview",
    config: {
      systemInstruction: systemPrompt || SYSTEM_PROMPT,
      temperature: 1,
      thinkingConfig: {
        thinkingLevel: "high",
      }
    },
  });

  return true;
}

export const sendChatMessage = async (message) => {
  if (!chat) throw new Error("Chat session not initialized. Call initChatSession first.");

  const res = await chat.sendMessage({
    message
  });

  return extractTextFromGeminiResponse(res);
}