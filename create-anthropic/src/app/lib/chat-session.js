import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "./prompts";

let chat = null;

export const initChatSession = async (systemPrompt) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  chat = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt || SYSTEM_PROMPT,
      temperature: 1,
    },
  });

  return true;
}

export const sendChatMessage = async (message) => {
  if (!chat) throw new Error("Chat session not initialized. Call initChatSession first.");

  const res = await chat.sendMessage({
    message
  });

  return res.text;
}