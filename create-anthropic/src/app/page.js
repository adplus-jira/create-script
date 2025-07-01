import { MainPage } from './component/main-page';
import { generateCharacter, getCharacterString } from './lib/character';
import { transformKeyContent, generateMainContent } from './lib/content-transformer';
import { SYSTEM_PROMPT, getUserPrompt } from './lib/prompts';
import * as constants from './lib/constants';

export default function Home() {
  const getMessage = async ({ temperature, top_p, top_k, count }) => {
    'use server';
    try {
      // 화자 설정
      const character = generateCharacter();
      const characterString = getCharacterString(character);

      // 접근 방식 선택
      const approach = constants.APPROACHES[Math.floor(Math.random() * constants.APPROACHES.length)];

      // 서브 키워드
      const subKeyword = constants.SUB_KEYWORDS[Math.floor(Math.random() * constants.SUB_KEYWORDS.length)];

      // 핵심 내용 변환
      const transformedContent = await transformKeyContent(
        constants.KEY_CONTENT,
        characterString,
        approach
      );
      
      // 사용자 메세지 생성
      const userMsg = getUserPrompt({
        mainKeyword: constants.MAIN_KEYWORD,
        subKeyword,
        marketName: constants.MARKET_NAME,
        keywordCount: constants.KEYWORD_COUNT,
        minLength: constants.MIN_LENGTH,
        imageCount: constants.IMAGE_COUNT,
        contentType: constants.CONTENT_TYPE,
        character: characterString,
        approach,
        transformedContent,
        additionalRequirements: constants.ADDITIONAL_REQUIREMENTS,
      });

      // 원고 제작
      const content = await generateMainContent({
        system: SYSTEM_PROMPT,
        model: 'claude-sonnet-4-20250514',
        userMsg,
        top_p,
        top_k,
      });

      return { content, status: 'success' };
    } catch (error) {
      console.error('Error:', error);
      return { content: error.message, status: 'error' };
    }
  };

  return (
    <div className="p-10 relative">
      <h1 className="text-3xl font-bold underline mb-8">Anthropic AI Example</h1>
      <MainPage getMessage={getMessage} />
    </div>
  );
}
