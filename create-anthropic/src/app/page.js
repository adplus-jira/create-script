import { MainPage } from './component/main-page';
import { generateCharacter, getCharacterString } from './lib/character';
import { transformKeyContent, generateMainContent } from './lib/content-transformer';
import { NEXT_USER_PROMPT, SYSTEM_PROMPT, getUserPrompt } from './lib/prompts';
import * as constants from './lib/constants';
import { GoogleGenAI } from '@google/genai';
import { initChatSession, sendChatMessage } from './lib/chat-session';

export default function Home() {

  const getMessage = async ({ type, keyword, message }) => {
    'use server';

    try {
      if (type === 'init') {
        await initChatSession();

        const transformedContent = await transformKeyContent(constants.KEY_CONTENT);

        const prompt = getUserPrompt({
          mainKeyword: keyword,
          // subKeyword: constants.SUB_KEYWORDS[Math.floor(Math.random() * constants.SUB_KEYWORDS.length)],
          marketName: constants.MARKET_NAME,
          keywordCount: constants.KEYWORD_COUNT,
          minLength: constants.MIN_LENGTH,
          imageCount: constants.IMAGE_COUNT,
          contentType: constants.CONTENT_TYPE,
          transformedContent: transformedContent,
          additionalRequirements: constants.ADDITIONAL_REQUIREMENTS,
        })

        const response = await sendChatMessage(prompt);
        return { content: response, status: 'success' };
      }
      // 이전과는 내용이 겹치지 않게, 유사원고처럼 보이지 않게 이전 지시사항을 참고해서 다음 원고를 작성하되, 문단 순서를 변경하고 그에 따라 내용도 바꿔서 작성해주세요.
      if (type === 'next') {
        console.log('Next message:', message);
        const nextPrompt = message || NEXT_USER_PROMPT;
        const response = await sendChatMessage(nextPrompt);
        return { content: response, status: 'success' };
      }

      return { content: 'Invalid type', status: 'error' };
    } catch (error) {
      console.error('Error:', error);
      return { content: error.message, status: 'error' };
    }
  }

  return (
    <div className='p-10 relative'>
      <h1 className='text-3xl font-bold underline mb-8'>원고 제작</h1>
      <MainPage getMessage={getMessage} />
    </div>
  )
}
