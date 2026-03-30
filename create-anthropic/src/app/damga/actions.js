'use server';

import { transformKeyContent } from '../lib/content-transformer';
import { SYSTEM_PROMPT } from './lib/system-prompt';
import { getUserPrompt, NEXT_USER_PROMPT } from './lib/user-prompts';
import { CHECK_PROMPT } from './lib/check-prompt';
import * as constants from '../lib/constants';
import { initChatSession, sendChatMessage } from '../lib/chat-session';

// 캐시: transformedContent를 한 번만 변환하여 재사용
let cachedTransformedContent = null;
let cacheKeyword = null;

const clampImageCount = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return constants.IMAGE_COUNT;
  return Math.min(20, Math.max(1, Math.floor(parsed)));
};

const cleanGeneratedText = (text) => {
  if (!text) return '';
  let cleaned = text.replace(/['"`**'']/g, '');
  // " <- (...)" 형태의 줄바꿈 메타데이터 제거
  cleaned = cleaned.replace(/<-\s*\([^)]*\)/g, '');
  return cleaned;
};

const countSequentialParagraphs = (content) => {
  const numberedLineRegex = /^\s*(\d{1,2})(?:\s*[.)]|\s+|$)/;
  const foundNumbers = new Set();

  content.split('\n').forEach((line) => {
    const match = line.match(numberedLineRegex);
    if (!match) return;

    const number = Number(match[1]);
    if (number >= 1 && number <= 99) {
      foundNumbers.add(number);
    }
  });

  let sequentialCount = 0;
  for (let i = 1; i <= 99; i += 1) {
    if (!foundNumbers.has(i)) break;
    sequentialCount = i;
  }

  return sequentialCount;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const countKeywordOccurrences = (content, keyword) => {
  if (!content || !keyword) return 0;
  const escaped = escapeRegExp(keyword.trim());
  if (!escaped) return 0;
  const regex = new RegExp(escaped, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
};

const buildParagraphCorrectionPrompt = ({ draft, expectedCount, actualCount }) => `
방금 작성한 원고를 아래 규칙으로 다시 정리해주세요.

<핵심 수정사항>
- 단락 번호가 현재 ${actualCount}개로 부족하거나 형식이 맞지 않습니다.
- 단락 번호는 반드시 1부터 ${expectedCount}까지 연속으로 정확히 작성하세요.
- 누락된 단락은 새로 추가하고, 기존 단락도 필요하면 재배치하세요.
- 최종 결과는 "완성된 원고 전체"만 출력하세요.
- 설명, 해설, 체크리스트, JSON, 코드블록은 절대 출력하지 마세요.

<재작성 대상 원고>
${draft}
`;

const buildKeywordCorrectionPrompt = ({ draft, keyword, expectedCount, actualCount }) => `
방금 작성한 원고를 아래 규칙에 맞게 다시 작성해주세요.

<핵심 수정사항>
- 메인 키워드 "${keyword}" 사용 횟수가 현재 ${actualCount}회로 부족합니다.
- 제목 1회 + 본문 ${Math.max(0, expectedCount - 1)}회, 총 ${expectedCount}회를 정확히 맞춰주세요.
- 메인 키워드는 띄어쓰기/철자를 절대 바꾸지 말고 "${keyword}" 그대로 사용하세요.
- 단순 나열이 아니라 문맥이 자연스럽게 이어지도록 전체 원고를 다듬어주세요.
- 최종 결과는 "완성된 원고 전체"만 출력하세요.
- 설명, 해설, 체크리스트, JSON, 코드블록은 절대 출력하지 마세요.

<재작성 대상 원고>
${draft}
`;

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
  const finalImageCount = clampImageCount(imageCount);

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

  // 특수문자, 메타데이터 정리
  let cleaned = cleanGeneratedText(response);
  let paragraphCount = countSequentialParagraphs(cleaned);
  let keywordCount = countKeywordOccurrences(cleaned, keyword);

  // 모델이 요구 단락 수를 못 맞추는 경우 자동 보정 (최대 2회)
  const maxCorrectionRetries = 2;
  for (let attempt = 0; attempt < maxCorrectionRetries && paragraphCount !== finalImageCount; attempt += 1) {
    const correctionPrompt = buildParagraphCorrectionPrompt({
      draft: cleaned,
      expectedCount: finalImageCount,
      actualCount: paragraphCount,
    });
    const corrected = await sendChatMessage(correctionPrompt);
    cleaned = cleanGeneratedText(corrected);
    paragraphCount = countSequentialParagraphs(cleaned);
    keywordCount = countKeywordOccurrences(cleaned, keyword);
  }

  // 모델이 메인 키워드 사용 횟수를 못 맞추는 경우 자동 보정 (최대 2회)
  const expectedKeywordCount = constants.KEYWORD_COUNT;
  for (let attempt = 0; attempt < maxCorrectionRetries && keywordCount < expectedKeywordCount; attempt += 1) {
    const keywordCorrectionPrompt = buildKeywordCorrectionPrompt({
      draft: cleaned,
      keyword,
      expectedCount: expectedKeywordCount,
      actualCount: keywordCount,
    });
    const corrected = await sendChatMessage(keywordCorrectionPrompt);
    cleaned = cleanGeneratedText(corrected);
    paragraphCount = countSequentialParagraphs(cleaned);
    keywordCount = countKeywordOccurrences(cleaned, keyword);
  }

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
