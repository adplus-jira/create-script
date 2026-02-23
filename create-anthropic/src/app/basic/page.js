import { ManualPage } from "../component/manual-page";
import { initChatSession, sendChatMessage } from "../lib/chat-session";

async function BasicPage() {
  const getMessage = async ({ type, systemPrompt, userPrompt, reviewPrompt, count, keywords = [] }) => {
    'use server';
    try {
      if (type === 'generateBatch') {
        if (!systemPrompt?.trim() || !userPrompt?.trim()) {
          return { status: 'error', content: '시스템 프롬프트와 유저 프롬프트를 모두 입력해주세요.' };
        }
        const keywordList = Array.isArray(keywords)
          ? keywords.map((keyword) => String(keyword).trim()).filter(Boolean)
          : [];
        if (keywordList.length === 0) {
          return { status: 'error', content: '키워드를 1개 이상 입력해주세요.' };
        }

        const parsedCount = Number(count);
        if (!Number.isFinite(parsedCount) || parsedCount < 1 || parsedCount > 20) {
          return { status: 'error', content: '원고 개수는 1~20 사이로 입력해주세요.' };
        }
        const targetCount = Math.floor(parsedCount);
        await initChatSession(systemPrompt);

        const manuscripts = [];
        for (const keyword of keywordList) {
          const keywordManuscripts = [];
          for (let i = 0; i < targetCount; i += 1) {
            const allLines = new Set();
            keywordManuscripts.forEach((manuscript) => {
              const lines = manuscript
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line && !/^\d+$/.test(line) && !line.startsWith('==='));
              lines.forEach((line) => allLines.add(line));
            });
            const previousLines = Array.from(allLines).slice(0, 80);
            const duplicateGuard =
              previousLines.length > 0
                ? `\n\n<중복 방지>\n다음 표현은 이전 원고에서 사용되었으니 반복하지 마세요.\n${previousLines.join('\n')}`
                : '';
            const sequenceHint =
              i === 0
                ? '\n\n<생성 순서>\n첫 번째 원고를 작성해주세요.'
                : `\n\n<생성 순서>\n${i + 1}번째 원고입니다. 이전 원고와 다른 전개/표현으로 작성해주세요.`;
            const reviewer = reviewPrompt?.trim()
              ? `\n\n${reviewPrompt.trim()}`
              : '';
            const prompt = `키워드: ${keyword}\n${userPrompt.trim()}${sequenceHint}${duplicateGuard}${reviewer}`;

            const response = await sendChatMessage(prompt);
            let cleaned = (response || '').trim();
            cleaned = cleaned.replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ''));
            cleaned = cleaned.replace(/['"`]/g, '');
            cleaned = cleaned.replace(/\*\*/g, '');
            cleaned = cleaned.replace(/<-\s*\([^)]*\)/g, '');
            const content = cleaned.trim();

            keywordManuscripts.push(content);
            manuscripts.push({
              keyword,
              localIndex: i + 1,
              content,
            });
          }
        }

        return { manuscripts, status: 'success' };
      }
      return { content: 'Invalid type', status: 'error' };
    } catch (error) {
      console.error('Error:', error);
      return { content: error.message, status: 'error' };
    }
  };

  return (
    <div className="p-10 relative">
      <ManualPage getMessage={getMessage} />
    </div>
  );
}

export default BasicPage;