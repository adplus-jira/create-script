import { ManualPage } from "../component/manual-page";
import { initChatSession, sendChatMessage } from "../lib/chat-session";

async function BasicPage() {
  const getMessage = async ({ type, systemPrompt, userPrompt, message }) => {
    'use server';
    try {
      if (type === 'init') {
        await initChatSession(systemPrompt);
        const first = userPrompt && userPrompt.trim().length > 0 ? userPrompt : '시작합니다.';
        const response = await sendChatMessage(first);
        return { content: response, status: 'success' };
      }
      if (type === 'next') {
        const nextMsg = message && message.trim().length > 0 ? message : '이어서 작성해줘.';
        const response = await sendChatMessage(nextMsg);
        return { content: response, status: 'success' };
      }
      return { content: 'Invalid type', status: 'error' };
    } catch (error) {
      console.error('Error:', error);
      return { content: error.message, status: 'error' };
    }
  };

  return (
    <div className="p-10 relative">
      <h1 className="text-3xl font-bold underline mb-8">수기 프롬프트 원고 제작</h1>
      <ManualPage getMessage={getMessage} />
    </div>
  );
}

export default BasicPage;