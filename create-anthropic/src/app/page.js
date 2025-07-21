import { MainPage } from './component/main-page';
import { generateCharacter, getCharacterString } from './lib/character';
import { transformKeyContent, generateMainContent } from './lib/content-transformer';
import { SYSTEM_PROMPT, getUserPrompt } from './lib/prompts';
import * as constants from './lib/constants';
import { GoogleGenAI } from '@google/genai';
import { initChatSession, sendChatMessage } from './lib/chat-session';
// import { SYSTEM_PROMPT } from './lib/gemini';

// export default function Home() {
//   const getMessage = async ({ temperature, top_p, top_k, count }) => {
//     'use server';
//     try {
//       // 서브 키워드
//       const subKeyword =
//         constants.SUB_KEYWORDS[Math.floor(Math.random() * constants.SUB_KEYWORDS.length)];
      
//       const ai = new GoogleGenAI({
//         apiKey: process.env.GEMINI_API_KEY,
//       });
//       // 핵심 내용 변환
//       const transformedContent = await transformKeyContent(constants.KEY_CONTENT);

//       // 사용자 메세지 생성
//       const userMsg = getUserPrompt({
//         mainKeyword: constants.MAIN_KEYWORD,
//         subKeyword,
//         marketName: constants.MARKET_NAME,
//         keywordCount: constants.KEYWORD_COUNT,
//         minLength: constants.MIN_LENGTH,
//         imageCount: constants.IMAGE_COUNT,
//         contentType: constants.CONTENT_TYPE,
//         transformedContent,
//         additionalRequirements: constants.ADDITIONAL_REQUIREMENTS,
//       });

//       const result = await ai.models.generateContent({
//         model: 'gemini-2.5-flash',
//         config: {
//           systemInstruction: SYSTEM_PROMPT,
//           temperature: 1.2,
//           thinkingConfig: {
//             thinkingBudget: 1000,
//           },
//         },
//         contents: userMsg,
//       });

//       const response =
//         result.text?.trim() || result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

//       // 원고 제작(claude)
//       // const content = await generateMainContent({
//       //   system: SYSTEM_PROMPT,
//       //   model: 'claude-sonnet-4-20250514',
//       //   userMsg,
//       //   top_p,
//       //   top_k,
//       // });

//       // return { content, status: 'success' };
//       return { content: response, status: 'success' };
//     } catch (error) {
//       console.error('Error:', error);
//       return { content: error.message, status: 'error' };
//     }
//   };

//   return (
//     <div className="p-10 relative">
//       <h1 className="text-3xl font-bold underline mb-8">원고 제작</h1>
//       <MainPage getMessage={getMessage} />
//     </div>
//   );
// }

export default function Home() {

  const getMessage = async ({ type, keyword }) => {
    'use server';

    try {
      if (type === 'init') {
        await initChatSession();

        const transformedContent = await transformKeyContent(constants.KEY_CONTENT);

        const prompt = getUserPrompt({
          mainKeyword: keyword,
          subKeyword: constants.SUB_KEYWORDS[Math.floor(Math.random() * constants.SUB_KEYWORDS.length)],
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

      if (type === 'next') {
        const nextPrompt = "이전과는 내용이 겹치지 않게, 유사원고처럼 보이지 않게 이전 지시사항을 참고해서 다음 원고를 작성해주세요.";
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
