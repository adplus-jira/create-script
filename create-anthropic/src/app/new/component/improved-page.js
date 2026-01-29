'use client';
import React from 'react';
import { IMAGE_COUNT } from '../../lib/constants';

export const ImprovedPage = ({ generateManuscript }) => {
  const [loading, setLoading] = React.useState(false);
  const [manuscripts, setManuscripts] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [copySuccess, setCopySuccess] = React.useState('');
  const [targetCount, setTargetCount] = React.useState(1);
  const [autoGenerate, setAutoGenerate] = React.useState(false);
  const [keepFeedback, setKeepFeedback] = React.useState(false);
  
  const keywordInput = React.useRef(null);
  const feedbackInput = React.useRef(null);
  const imageCountInput = React.useRef(null);
  const cancelRef = React.useRef(false);

  const clampCount = (value) => {
    const n = Number.isFinite(value) ? value : parseInt(value, 10);
    if (!Number.isFinite(n)) return 1;
    return Math.min(20, Math.max(1, n));
  };

  const handleStart = async () => {
    if (!keywordInput.current.value) {
      alert('키워드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setCopySuccess('');
    cancelRef.current = false;
    
    const imageCount = imageCountInput.current.value 
      ? parseInt(imageCountInput.current.value) 
      : IMAGE_COUNT;

    const keyword = keywordInput.current.value;
    const feedbackSnapshot = feedbackInput.current.value;
    const finalTargetCount = clampCount(targetCount);
    
    try {
      const result = await generateManuscript({
        type: 'init',
        keyword,
        imageCount: imageCount,
        previousManuscripts: manuscripts
      });
      
      if (result.status === 'error') {
        alert('오류: ' + result.content);
      } else {
        let nextManuscripts = [result.content];
        setManuscripts(nextManuscripts);
        setSelectedIndex(0);
        if (!keepFeedback) feedbackInput.current.value = '';

        // 자동 생성: 목표 개수까지 next를 반복 실행
        if (autoGenerate && finalTargetCount > 1) {
          for (let i = 1; i < finalTargetCount; i += 1) {
            if (cancelRef.current) break;
            const nextResult = await generateManuscript({
              type: 'next',
              keyword,
              imageCount: imageCount,
              feedback: keepFeedback ? feedbackSnapshot : '',
              previousManuscripts: nextManuscripts,
            });

            if (nextResult.status === 'error') {
              alert('오류: ' + nextResult.content);
              break;
            }

            nextManuscripts = [...nextManuscripts, nextResult.content];
            setManuscripts(nextManuscripts);
            setSelectedIndex(nextManuscripts.length - 1);
            if (!keepFeedback) feedbackInput.current.value = '';
          }
        }
      }
    } catch (error) {
      alert('생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (manuscripts.length === 0) {
      alert('먼저 "시작" 버튼을 눌러 첫 원고를 생성해주세요.');
      return;
    }

    setLoading(true);
    setCopySuccess('');
    cancelRef.current = false;
    
    const imageCount = imageCountInput.current.value 
      ? parseInt(imageCountInput.current.value) 
      : IMAGE_COUNT;
    
    try {
      const result = await generateManuscript({
        type: 'next',
        keyword: keywordInput.current.value,
        imageCount: imageCount,
        feedback: feedbackInput.current.value,
        previousManuscripts: manuscripts
      });
      
      if (result.status === 'error') {
        alert('오류: ' + result.content);
      } else {
        setManuscripts([...manuscripts, result.content]);
        setSelectedIndex(manuscripts.length);
        if (!keepFeedback) feedbackInput.current.value = '';
      }
    } catch (error) {
      alert('생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('✅ 클립보드에 복사되었습니다!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (err) {
      alert('복사 실패: ' + err.message);
    }
  };

  const downloadManuscript = (content, index) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `원고_${index + 1}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllManuscripts = () => {
    manuscripts.forEach((manuscript, index) => {
      setTimeout(() => {
        downloadManuscript(manuscript, index);
      }, index * 100);
    });
  };

  const clearAll = () => {
    if (confirm('모든 원고를 삭제하시겠습니까?')) {
      cancelRef.current = true;
      setManuscripts([]);
      setSelectedIndex(0);
      setCopySuccess('');
      feedbackInput.current.value = '';
    }
  };

  const finalTargetCount = clampCount(targetCount);
  const showProgress = autoGenerate && finalTargetCount > 1 && manuscripts.length > 0;
  const progressPct = showProgress
    ? Math.min(100, Math.round((manuscripts.length / finalTargetCount) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {loading && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">원고 생성 중...</div>
            <div className="text-sm text-gray-500 mt-2">잠시만 기다려주세요.</div>
            <button
              onClick={() => {
                cancelRef.current = true;
              }}
              className="mt-4 w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors font-semibold"
            >
              ⏹️ 중단
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* 입력 영역 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">원고 생성 설정</h2>
              <p className="text-sm text-gray-500 mt-1">
                기본 입력을 채운 뒤, 필요하면 자동 생성으로 N개를 한 번에 채울 수 있어요.
              </p>
            </div>
            {showProgress && (
              <div className="min-w-[180px]">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span className="font-medium">진행률</span>
                  <span className="font-semibold text-blue-700">
                    {manuscripts.length}/{finalTargetCount} ({progressPct}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 기본 입력 */}
            <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-gray-800">기본 입력</div>
                <div className="text-xs text-gray-500">필수: 메인 키워드</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메인 키워드
                  </label>
                  <input
                    type="text"
                    ref={keywordInput}
                    placeholder="예: 갈비 창업 브랜드"
                    className="w-full border-2 border-gray-300 p-3 rounded-md focus:border-blue-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이미지 개수
                    <span className="text-xs text-gray-500 font-normal"> (기본 {IMAGE_COUNT})</span>
                  </label>
                  <input
                    type="number"
                    ref={imageCountInput}
                    placeholder={IMAGE_COUNT.toString()}
                    min="1"
                    className="w-full border-2 border-gray-300 p-3 rounded-md focus:border-blue-500 focus:outline-none bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    미입력 시 기본값을 사용합니다.
                  </p>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    피드백 (선택)
                  </label>
                  <input
                    type="text"
                    ref={feedbackInput}
                    placeholder="예: 더 친근한 말투로, 사례를 더 강조해줘"
                    className="w-full border-2 border-gray-300 p-3 rounded-md focus:border-blue-500 focus:outline-none bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    다음 원고 생성 시 반영할 요청사항을 입력하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 자동/반복 설정 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm font-semibold text-gray-800 mb-3">자동·반복 설정</div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                만들어야 하는 원고 개수 (1~20)
              </label>
              <input
                type="number"
                value={finalTargetCount}
                min={1}
                max={20}
                onChange={(e) => setTargetCount(clampCount(e.target.value))}
                className="w-full border-2 border-gray-300 p-3 rounded-md focus:border-blue-500 focus:outline-none bg-white"
              />
              <p className="text-xs text-gray-500 mt-1 mb-3">
                자동 생성 ON이면, 시작 후 목표 개수까지 자동으로 생성합니다.
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700 select-none bg-white border border-gray-200 rounded-md px-3 py-2">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>자동으로 다음 원고 생성 (N개 채우기)</span>
                </label>
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700 select-none bg-white border border-gray-200 rounded-md px-3 py-2">
                  <input
                    type="checkbox"
                    checked={keepFeedback}
                    onChange={(e) => setKeepFeedback(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span>피드백 입력값을 반복 사용(유지)</span>
                </label>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                팁: 자동 생성 중에는 로딩창에서 <span className="font-semibold">중단</span>할 수 있어요.
              </div>
            </div>
          </div>
          
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStart}
              disabled={loading}
              className="sm:flex-1 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              🚀 시작{autoGenerate && finalTargetCount > 1 ? ` (자동 ${finalTargetCount}개)` : ''}
            </button>
            <button
              onClick={handleNext}
              disabled={loading || manuscripts.length === 0}
              className="sm:flex-1 bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              ➡️ 다음 원고 생성
            </button>
            <button
              onClick={clearAll}
              disabled={loading || manuscripts.length === 0}
              className="sm:w-auto bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              🗑️ 전체 삭제
            </button>
          </div>

          {manuscripts.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <span className="text-sm text-blue-900 font-medium">
                  총 {manuscripts.length}개의 원고가 생성되었습니다.
                  {autoGenerate && finalTargetCount > 1 ? ` (진행: ${manuscripts.length}/${finalTargetCount})` : ''}
                </span>
                <button
                  onClick={downloadAllManuscripts}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-semibold"
                >
                  📥 전체 다운로드
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 원고 목록 */}
        {manuscripts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">생성된 원고 목록</h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {manuscripts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedIndex(index);
                    setCopySuccess('');
                  }}
                  className={`p-3 rounded-md font-semibold transition-colors ${
                    selectedIndex === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 원고 미리보기 */}
        {manuscripts.length > 0 && manuscripts[selectedIndex] && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                원고 {selectedIndex + 1} 미리보기
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(manuscripts[selectedIndex])}
                  className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors font-semibold"
                >
                  📋 복사
                </button>
                <button
                  onClick={() => downloadManuscript(manuscripts[selectedIndex], selectedIndex)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors font-semibold"
                >
                  💾 다운로드
                </button>
              </div>
            </div>

            {copySuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md font-medium">
                {copySuccess}
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-md border border-gray-200 max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed font-sans">
                {manuscripts[selectedIndex]}
              </pre>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              글자 수: {manuscripts[selectedIndex].length.toLocaleString()}자
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        {manuscripts.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              원고 생성을 시작하세요
            </h3>
            <p className="text-gray-600 mb-6">
              키워드를 입력한 후 "시작" 버튼을 클릭하세요.
            </p>
            
            <div className="mt-6 text-left max-w-2xl mx-auto space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-bold text-blue-900 mb-2">✨ 주요 기능</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>시작</strong>: 새로운 세션으로 첫 원고 생성</li>
                  <li>• <strong>다음 원고 생성</strong>: 이전 원고와 겹치지 않게 추가 생성</li>
                  <li>• <strong>피드백</strong>: 원하는 스타일이나 내용 요청</li>
                  <li>• <strong>클립보드 복사</strong>: 원고를 바로 복사하여 사용</li>
                  <li>• <strong>특수문자 자동 제거</strong>: ', ", **, ` 자동 제거</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-2">💡 사용 팁</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• 첫 원고를 보고 마음에 들면 "다음" 버튼으로 계속 생성</li>
                  <li>• 피드백 입력으로 원하는 방향으로 조정 가능</li>
                  <li>• 이전 원고들과 자동으로 비교하여 중복 표현 제거</li>
                  <li>• 필요한 만큼 계속 생성 가능 (10개, 20개 등)</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <h4 className="font-bold text-green-900 mb-2">🎯 개선된 점</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• 피드백 기능으로 원하는 스타일 반영</li>
                  <li>• 이전 원고들과 비교하여 중복 자동 방지</li>
                  <li>• 클립보드 복사로 즉시 활용 가능</li>
                  <li>• 기존 방식처럼 하나씩 확인하며 생성</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

