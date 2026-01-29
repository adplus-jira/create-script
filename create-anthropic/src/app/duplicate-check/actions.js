'use server';

import { GoogleGenAI } from "@google/genai";
import { DUPLICATE_CHECK_SYSTEM_PROMPT, getDuplicateCheckUserPrompt } from './lib/prompt';

// 파일에서 문장 추출 (엔터 기준)
function extractSentences(content, excludeStrings = []) {
  return content.split('\n')
    .map(line => line.trim())
    .filter(line => {
      // 빈 줄 제외
      if (line.length === 0) return false;
      
      // 숫자만 있는 줄 제외 (예: "1", "20", "100", "1 2 3" 등)
      if (/^[\d\s]+$/.test(line)) return false;
      
      // 사용자 정의 제외 문자열 확인
      if (excludeStrings.some(exclude => line === exclude || line.includes(exclude))) {
        return false;
      }
      
      return true;
    });
}

// 중복 문장 찾기
function findDuplicateSentences(files, excludeStrings = []) {
  const sentenceCount = new Map();
  const sentenceInFiles = new Map(); // 각 문장이 어떤 파일에 있는지

  // 모든 문장 수집
  files.forEach((file, fileIndex) => {
    const sentences = extractSentences(file.content, excludeStrings);
    sentences.forEach((sentence, sentenceIndex) => {
      if (!sentenceCount.has(sentence)) {
        sentenceCount.set(sentence, 0);
        sentenceInFiles.set(sentence, []);
      }
      sentenceCount.set(sentence, sentenceCount.get(sentence) + 1);
      sentenceInFiles.get(sentence).push({ fileIndex, sentenceIndex, sentence });
    });
  });

  // 중복 문장 찾기 (2개 이상 파일에 나타나는 문장)
  const duplicateSentences = [];
  sentenceCount.forEach((count, sentence) => {
    if (count > 1) {
      duplicateSentences.push({
        sentence,
        count: count, // 이 문장이 몇 개 파일에 중복되는지
        files: sentenceInFiles.get(sentence)
      });
    }
  });

  return duplicateSentences;
}

// Gemini 응답에서 대체 문장 파싱
function parseReplacementsFromResponse(response) {
  const replacements = [];
  const sectionRegex = /=== 변경 문장 \d+ ===\s*원본:\s*(.+?)\s*대체\d+:\s*(.+?)(?=\s*(?:대체\d+:|\n\s*=== 변경 문장 \d+ ===|$))/gs;
  
  let match;
  while ((match = sectionRegex.exec(response)) !== null) {
    const original = match[1].trim();
    const replacements_match = [];
    
    // 대체 문장 추출
    const alternatives = response.substring(match.index).match(/대체\d+:\s*(.+?)(?=\s*대체\d+:|\s*=== 변경 문장 \d+ ===|$)/gs);
    if (alternatives) {
      alternatives.forEach(alt => {
        const altSentence = alt.replace(/대체\d+:\s*/, '').trim();
        if (altSentence) {
          replacements_match.push(altSentence);
        }
      });
    }
    
    replacements.push({
      original,
      alternatives: replacements_match
    });
  }

  // 더 간단한 파싱 시도 (위의 정규식이 실패한 경우)
  if (replacements.length === 0) {
    const lines = response.split('\n');
    let currentSection = null;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // 섹션 시작
      if (trimmedLine.includes('=== 변경 문장')) {
        // 이전 섹션 저장
        if (currentSection && currentSection.original && currentSection.alternatives.length > 0) {
          replacements.push(currentSection);
        }
        currentSection = { original: '', alternatives: [] };
      } 
      // 원본 문장
      else if (trimmedLine.startsWith('원본:')) {
        if (currentSection) {
          currentSection.original = trimmedLine.replace(/원본:\s*/, '').trim().replace(/^["']|["']$/g, '');
        }
      } 
      // 대체 문장
      else if (trimmedLine.match(/^대체\d+:/)) {
        if (currentSection) {
          const alt = trimmedLine.replace(/대체\d+:\s*/, '').trim().replace(/^["']|["']$/g, '');
          if (alt && alt.length > 0) {
            currentSection.alternatives.push(alt);
          }
        }
      }
    });
    
    // 마지막 섹션 저장
    if (currentSection && currentSection.original && currentSection.alternatives.length > 0) {
      replacements.push(currentSection);
    }
  }
  
  // 여전히 replacements가 비어있으면 로그 출력
  if (replacements.length === 0) {
    console.log('[파싱] Gemini 응답에서 대체 문장을 찾을 수 없음');
    console.log('[파싱] 응답 내용:', response.substring(0, 500));
  }

  console.log("대체문장 배열 : ", replacements)
  
  return replacements;
}

// 파일에 문장 교체 적용
function applyReplacements(files, duplicates, replacements) {
  // 각 중복 문장별로 전체적으로 몇 번째로 나타나는지 추적
  const globalOccurrenceCounters = new Map();
  
  // 모든 중복 문장에 대해 각 문장이 전체에서 몇 번째로 나타나는지 카운트할 Map 생성
  const sentenceOccurrences = new Map();
  duplicates.forEach(dup => {
    const occurrences = dup.files.map(f => ({
      fileIndex: f.fileIndex,
      sentenceIndex: f.sentenceIndex
    }));
    occurrences.sort((a, b) => a.fileIndex - b.fileIndex);
    sentenceOccurrences.set(dup.sentence, {
      firstFileIndex: occurrences[0]?.fileIndex,
      totalOccurrences: occurrences.length,
      allOccurrences: occurrences
    });
    // 전역 카운터 초기화
    globalOccurrenceCounters.set(dup.sentence, 0);
  });

  return files.map((file, fileIndex) => {
    const originalLines = file.content.split('\n');

    // 이 파일에 나타나는 중복 문장들과 그 대체 문장 매핑
    const fileReplacements = [];
    duplicates.forEach((dup) => {
      // 이 파일에 이 중복 문장이 있는지 확인
      const inThisFile = dup.files.some(f => f.fileIndex === fileIndex);
      if (inThisFile) {
        // replacements에서 해당 문장 찾기 (인덱스가 아닌 내용으로 매칭)
        const replacement = replacements.find(r => 
          r.original.trim() === dup.sentence.trim() || 
          r.original === dup.sentence
        );
        if (replacement && replacement.alternatives && replacement.alternatives.length > 0) {
          // 이 문장의 출현 정보 가져오기
          const occInfo = sentenceOccurrences.get(dup.sentence);
          // 이 파일이 첫 번째 발생 파일인지 확인
          const isFirstFile = occInfo?.firstFileIndex === fileIndex;
          
          fileReplacements.push({
            original: dup.sentence,
            alternatives: replacement.alternatives,
            isFirstFile: isFirstFile
          });
        }
      }
    });

    let modifiedContent = '';
    originalLines.forEach(line => {
      const trimmedLine = line.trim();
      
      // 빈 줄은 그대로 유지
      if (trimmedLine.length === 0) {
        modifiedContent += line + '\n';
        return;
      }

      // 이 라인이 중복 문장인지 확인하고 교체
      let replaced = false;
      for (const repl of fileReplacements) {
        if (trimmedLine === repl.original) {
          // 전역 카운터 가져오기
          const globalCounter = globalOccurrenceCounters.get(repl.original);
          // 전역 카운터 증가 (다음 발생을 위해)
          globalOccurrenceCounters.set(repl.original, globalCounter + 1);
          
          // 첫 번째 파일의 첫 번째 발생만 원본 유지
          const isFirstOccurrence = repl.isFirstFile && globalCounter === 0;
          
          if (isFirstOccurrence) {
            // 원본 유지 (첫 번째 파일의 첫 번째 발생만)
            modifiedContent += line + '\n';
            console.log(`[원본유지] 파일 ${fileIndex + 1}, 문장: ${trimmedLine.substring(0, 30)}..., globalCounter: ${globalCounter}`);
          } else {
            // 그 외는 모두 대체 문장 사용
            if (repl.alternatives.length > 0) {
              // 대체 문장 인덱스 계산
              // 전역 카운터 기준으로 계산 (첫 번째 파일의 첫 번째는 제외)
              const altIndex = globalCounter - 1;
              const chosenAlt = repl.alternatives[altIndex % repl.alternatives.length];
              
              // chosenAlt가 undefined이거나 altIndex가 음수인 경우 안전하게 처리
              if (!chosenAlt || altIndex < 0) {
                console.error(`[오류] 대체 문장이 없습니다. altIndex: ${altIndex}, globalCounter: ${globalCounter}, alternatives.length: ${repl.alternatives.length}`);
                modifiedContent += line + '\n';
                replaced = true;
                break;
              }

              const spacing = line.match(/^(\s*)/)[1] || '';
              
              console.log(`[교체] 파일 ${fileIndex + 1}, 문장: ${trimmedLine.substring(0, 30)}..., isFirstFile: ${repl.isFirstFile}, globalCounter: ${globalCounter}, altIndex: ${altIndex}, 대체: ${chosenAlt.substring(0, Math.min(chosenAlt.length, 30))}`);
              
              modifiedContent += spacing + chosenAlt + '\n';
            } else {
              // 대체 문장이 없으면 원본 유지
              modifiedContent += line + '\n';
            }
          }
          replaced = true;
          break;
        }
      }

      // 교체되지 않은 경우 원본 유지
      if (!replaced) {
        modifiedContent += line + '\n';
      }
    });

    // 특수문자 제거 (new/actions.js와 동일한 필터)
    let cleanedContent = modifiedContent.replace(/['"`**'']/g, '');
    // " <- (...)" 형태의 줄바꿈 메타데이터 제거
    cleanedContent = cleanedContent.replace(/<-\s*\([^)]*\)/g, '');

    return {
      name: file.name,
      content: cleanedContent
    };
  });
}

// 중복 문장만 검사 (변환 전)
export async function findDuplicates({ files, excludeStrings = [] }) {
  try {
    console.log('[중복 검사] 시작 - 파일 수:', files.length);
    console.log('[중복 검사] 제외할 문자열:', excludeStrings);

    // 1. 중복 문장 찾기
    const duplicates = findDuplicateSentences(files, excludeStrings);
    console.log('[중복 검사] 중복 문장 수:', duplicates.length);

    // 결과 포맷팅: 각 중복 문장과 나타나는 파일명들
    const result = duplicates.map((dup, index) => {
      const fileNames = dup.files.map(f => files[f.fileIndex].name);
      return {
        id: index + 1,
        sentence: dup.sentence,
        files: fileNames,
        count: dup.count
      };
    });

    return {
      status: 'success',
      duplicates: result
    };

  } catch (error) {
    console.error('[중복 검사] 오류:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

// 중복 검사 및 수정 (실제 변환 수행)
export async function applyTransforms({ files, excludeStrings = [] }) {
  try {
    console.log('[변환 시작] 파일 수:', files.length);
    console.log('[변환] 제외할 문자열:', excludeStrings);

    // 1. 중복 문장 찾기
    const duplicates = findDuplicateSentences(files, excludeStrings);
    console.log('[변환] 중복 문장 수:', duplicates.length);

    // 중복 문장이 없으면 그대로 반환
    if (duplicates.length === 0) {
      console.log('[중복 검사] 중복 문장이 없습니다.');
      return {
        status: 'success',
        files: files.map(f => ({ name: f.name, content: f.content }))
      };
    }

    // 2. Gemini에게 대체 문장 요청
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const chat = ai.chats.create({
      model: "gemini-2.5-flash-lite",
      config: {
        systemInstruction: DUPLICATE_CHECK_SYSTEM_PROMPT,
        temperature: 1,
      },
    });

    // 중복 문장 정보 준비
    // 예: 2개 중복 → 1개만 대체 필요, 3개 중복 → 2개 대체 필요
    const duplicateSentencesForPrompt = duplicates.map(dup => {
      const neededCount = dup.count - 1;
      console.log(`[프롬프트] 중복 문장: "${dup.sentence.substring(0, 30)}...", 중복 횟수: ${dup.count}, 필요한 대체: ${neededCount}`);
      return {
        sentence: dup.sentence,
        count: neededCount
      };
    });

    const userPrompt = getDuplicateCheckUserPrompt({ 
      duplicateSentences: duplicateSentencesForPrompt
    });
    console.log('[중복 검사] Gemini API 호출 중...');
    
    const response = await chat.sendMessage({
      message: userPrompt
    });

    const responseText = response.text;
    console.log('[중복 검사] Gemini 응답 수신 완료');
    console.log(responseText);

    // 3. 응답에서 대체 문장 추출
    const replacements = parseReplacementsFromResponse(responseText);
    console.log('[중복 검사] 대체 문장 파싱 완료:', replacements.length);

    if (replacements.length === 0) {
      // 파싱 실패 시 간단한 방식으로 재시도
      console.log('[중복 검사] 파싱 실패, 재시도 중...');
      return {
        status: 'error',
        message: '대체 문장 파싱에 실패했습니다. 응답 형식을 확인해주세요.'
      };
    }

    // 4. 파일에 문장 교체 적용
    const modifiedFiles = applyReplacements(files, duplicates, replacements);

    console.log('[중복 검사] 파일 교체 완료');

    return {
      status: 'success',
      files: modifiedFiles
    };

  } catch (error) {
    console.error('[중복 검사] 오류:', error);
    
    let errorMessage = error.message;
    if (error.message?.includes('INTERNAL')) {
      errorMessage = 'Google AI API 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.message?.includes('API_KEY')) {
      errorMessage = 'API 키가 올바르지 않습니다. .env 파일의 GEMINI_API_KEY를 확인해주세요.';
    }
    
    return {
      status: 'error',
      message: errorMessage
    };
  }
}

