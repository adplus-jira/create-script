'use server';

import { transformKeyContent } from '../lib/content-transformer';
import { SYSTEM_PROMPT, getUserPrompt, NEXT_USER_PROMPT, CHECK_PROMPT } from './lib/improved-prompts';
import * as constants from '../lib/constants';
import { initChatSession, sendChatMessage } from '../lib/chat-session';

// 캐시: transformedContent를 한 번만 변환하여 재사용
let cachedTransformedContent = null;
let cacheKeyword = null;

// 원고에서 라인 추출 (중복 검사용)
const extractLines = (manuscripts) => {
  const allLines = new Set();
  manuscripts.forEach(manuscript => {
    const lines = manuscript.split('\n')
      .map(line => line.trim())
      .filter(line => {
        // 빈 줄, 숫자만 있는 줄, 구분선 제외
        if (!line) return false;
        if (/^\d+$/.test(line)) return false;
        if (line.startsWith('===')) return false;
        return true;
      });
    lines.forEach(line => allLines.add(line));
  });
  return Array.from(allLines);
};

// 공통 원고 생성 로직
async function generateManuscriptInternal({ keyword, previousManuscripts, feedback, isFirst, imageCount }) {
  // 이전 원고에서 중복 표현 추출
  const previousLines = previousManuscripts.length > 0 
    ? extractLines(previousManuscripts).slice(0, 100)
    : [];
  
  // System Prompt에 중복 방지 정보 추가
  const customSystemPrompt = SYSTEM_PROMPT + (previousLines.length > 0 ? `

<중복 방지>
다음 표현들은 이전 원고에서 사용되었으므로 절대 사용하지 마세요:
${previousLines.slice(0, 50).join('\n')}
` : '');

  // 세션 초기화
  await initChatSession(customSystemPrompt);

  // imageCount가 없으면 기본값 사용
  const finalImageCount = imageCount || constants.IMAGE_COUNT;

  // 프롬프트 생성
  let combinedPrompt = getUserPrompt({
    mainKeyword: keyword,
    marketName: constants.MARKET_NAME,
    keywordCount: constants.KEYWORD_COUNT,
    minLength: constants.MIN_LENGTH,
    maxLength: constants.MAX_LENGTH,
    imageCount: finalImageCount,
    contentType: constants.CONTENT_TYPE,
    transformedContent: cachedTransformedContent,
    additionalRequirements: constants.ADDITIONAL_REQUIREMENTS,
  });

  // 첫 원고가 아니면 NEXT_USER_PROMPT 추가
  if (!isFirst) {
    combinedPrompt += '\n\n' + NEXT_USER_PROMPT;
  }

  // 피드백이 있으면 추가
  if (feedback && feedback.trim()) {
    combinedPrompt += `\n\n<추가 요청사항>\n${feedback}\n\n위 요청사항을 반영하여 원고를 작성해주세요.`;
  }

  // CHECK_PROMPT 추가 (검토까지 한 번에)
  combinedPrompt += '\n\n' + CHECK_PROMPT;

  // 한 번의 API 호출로 원고 생성 및 검토
  const response = await sendChatMessage(combinedPrompt);
  
  // 특수문자 제거 및 줄바꿈 표시 메타데이터 제거
  let cleaned = response.replace(/['"`**'']/g, '');
  // " <- (...)" 형태의 줄바꿈 메타데이터 제거
  cleaned = cleaned.replace(/<-\s*\([^)]*\)/g, '');
  
  return cleaned;
}

// 원고 생성 (하나씩)
export async function generateManuscript({ type, keyword, feedback, previousManuscripts = [], imageCount }) {
  try {
    // transformedContent 캐싱 (키워드가 바뀔 때만 다시 변환)
    if (!cachedTransformedContent || cacheKeyword !== keyword) {
      console.log('[최적화] transformedContent 새로 생성');
      cachedTransformedContent = await transformKeyContent(constants.KEY_CONTENT);
      cacheKeyword = keyword;
    } else {
      console.log('[최적화] transformedContent 캐시 재사용 (API 호출 절약)');
    }

    // 공통 로직 사용
    if (type === 'init') {
      console.log('[최적화] 첫 원고 생성 - API 호출 1회');
      const response = await generateManuscriptInternal({
        keyword,
        previousManuscripts,
        feedback,
        isFirst: true,
        imageCount
      });
      return { content: response, status: 'success' };
    }

    if (type === 'next') {
      console.log('[최적화] 다음 원고 생성 - API 호출 1회');
      const response = await generateManuscriptInternal({
        keyword,
        previousManuscripts,
        feedback,
        isFirst: false,
        imageCount
      });
      return { content: response, status: 'success' };
    }

    return { content: 'Invalid type', status: 'error' };
  } catch (error) {
    console.error('원고 생성 오류:', error);
    
    let errorMessage = error.message;
    if (error.message?.includes('INTERNAL')) {
      errorMessage = 'Google AI API 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message?.includes('API_KEY')) {
      errorMessage = 'API 키가 올바르지 않습니다. .env 파일의 GEMINI_API_KEY를 확인해주세요.';
    }
    
    return { content: errorMessage, status: 'error' };
  }
}

