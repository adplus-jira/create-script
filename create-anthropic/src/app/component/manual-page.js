'use client';
import React from 'react';

export const ManualPage = ({ getMessage }) => {
  const [loading, setLoading] = React.useState(false);
  const [manuscripts, setManuscripts] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [copySuccess, setCopySuccess] = React.useState('');
  const [count, setCount] = React.useState('');
  const [keywordsInput, setKeywordsInput] = React.useState('');

  const systemPromptRef = React.useRef(null);
  const userPromptRef = React.useRef(null);
  const reviewPromptRef = React.useRef(null);

  const defaultReviewPrompt = `[역할] 블로그 원고 검토
[목표] 흠이 없는 원고 제작
[검토항목]
- 키워드 개수(글자 그대로) 6개 ~ 8개 사이로 들어가 있는가?
- 글자 수가 (length 함수 기준) 1,200자 이상 1,800자 이하인가?
- 이모지 개수가 4개 이내로 사용되었는가?
[요구사항]
전달 받은 원고에 대하여 검토항목을 검토하고 대답없이 수정된 원고만 형식에 맞춰 전달해주세요.
꼭 20글자 내외 줄바꿈 처리 해주세요.
한 문장이 끝나면 보기와 같이 줄바꿈을 추가해주세요.
[보기]
금세 편안해지더라고요^^;
눈 지그시 감고 잘 맞았습니다.

약이 들어가서 팔이 약간 뻣뻣해졌지만
끝나고 바로 나와서 돌아다니는데
전혀 문제없었어요.`;

  const clampCount = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.min(20, Math.max(1, Math.floor(parsed)));
  };

  const parseKeywords = (value) =>
    String(value || '')
      .split(/\r?\n|,/)
      .map((keyword) => keyword.trim())
      .filter(Boolean);

  const getManuscriptContent = (manuscript) => {
    if (typeof manuscript === 'string') return manuscript;
    return manuscript?.content || '';
  };

  const toSafeFileKeyword = (keyword) =>
    String(keyword || '')
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_');

  const handleGenerate = async () => {
    if (!systemPromptRef.current?.value?.trim()) {
      alert('시스템 프롬프트를 입력해주세요.');
      return;
    }
    if (!userPromptRef.current?.value?.trim()) {
      alert('유저 프롬프트를 입력해주세요.');
      return;
    }
    const finalCount = clampCount(count);
    if (!finalCount) {
      alert('원고 개수(1~20)를 입력해주세요.');
      return;
    }
    const keywords = parseKeywords(keywordsInput);
    if (keywords.length === 0) {
      alert('키워드를 1개 이상 입력해주세요.');
      return;
    }

    setLoading(true);
    setCopySuccess('');
    const payload = {
      type: 'generateBatch',
      systemPrompt: systemPromptRef.current?.value || '',
      userPrompt: userPromptRef.current?.value || '',
      reviewPrompt: reviewPromptRef.current?.value || '',
      count: finalCount,
      keywords,
    };

    const res = await getMessage(payload);
    if (res.status === 'error' || !Array.isArray(res.manuscripts)) {
      alert('Error: ' + (res.content || '원고 생성에 실패했습니다.'));
      setLoading(false);
      return;
    }
    setManuscripts(res.manuscripts);
    setSelectedIndex(0);
    setLoading(false);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('✅ 클립보드에 복사되었습니다!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (error) {
      alert('복사 실패: ' + error.message);
    }
  };

  const downloadManuscript = (manuscript, index) => {
    const content = getManuscriptContent(manuscript);
    const safeKeyword = toSafeFileKeyword(manuscript?.keyword);
    const filenamePrefix = safeKeyword || '원고';
    const fileIndex = manuscript?.localIndex || index + 1;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenamePrefix}_${fileIndex}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    manuscripts.forEach((manuscript, index) => {
      setTimeout(() => {
        downloadManuscript(manuscript, index);
      }, index * 100);
    });
  };

  const clearAll = () => {
    if (confirm('생성된 원고를 모두 삭제할까요?')) {
      setManuscripts([]);
      setSelectedIndex(0);
      setCopySuccess('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 rounded-lg">
      {loading && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">원고 생성 중...</div>
            <div className="text-sm text-gray-500 mt-2">
              {(clampCount(count) || 0) * parseKeywords(keywordsInput).length}개 원고를 순차 생성합니다.
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">프롬프트 입력</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">시스템 프롬프트</label>
              <textarea
                ref={systemPromptRef}
                placeholder="시스템 프롬프트를 입력하세요."
                className="border-2 border-gray-300 p-3 rounded-md w-full h-[220px] focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">유저 프롬프트</label>
              <textarea
                ref={userPromptRef}
                placeholder="유저 프롬프트를 입력하세요."
                className="border-2 border-gray-300 p-3 rounded-md w-full h-[220px] focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">검토 프롬프트</label>
              <textarea
                ref={reviewPromptRef}
                defaultValue={defaultReviewPrompt}
                className="border-2 border-gray-300 p-3 rounded-md w-full h-[220px] focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="sm:w-56">
              <label className="block text-sm font-medium text-gray-700 mb-2">원고 개수 (1~20)</label>
              <input
                type="number"
                value={count}
                min={1}
                max={20}
                onChange={(e) => setCount(e.target.value)}
                placeholder="예: 10"
                className="border-2 border-gray-300 p-3 rounded-md w-full focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex-1 flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                🚀 원고 자동 생성
              </button>
              <button
                onClick={clearAll}
                disabled={loading || manuscripts.length === 0}
                className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                🗑️ 전체 삭제
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              키워드 목록 (줄바꿈/쉼표 구분)
            </label>
            <textarea
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder={'예:\n강남메이드유\n강남피부과\n강남눈성형'}
              className="border-2 border-gray-300 p-3 rounded-md w-full h-[140px] focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              각 키워드마다 유저 프롬프트 첫 줄에 <span className="font-semibold">키워드: ...</span>가 자동 추가됩니다.
            </p>
          </div>

          {manuscripts.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-100 flex items-center justify-between">
              <span className="text-sm text-blue-900 font-medium">
                총 {manuscripts.length}개의 원고가 생성되었습니다.
              </span>
              <button
                onClick={downloadAll}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-semibold"
              >
                📥 전체 다운로드
              </button>
            </div>
          )}
        </div>

        {manuscripts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">생성된 원고 목록</h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {manuscripts.map((manuscript, index) => (
                <button
                  key={index}
                  className={`p-3 rounded-md font-semibold transition-colors ${
                    selectedIndex === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedIndex(index);
                    setCopySuccess('');
                  }}
                >
                  {manuscript?.keyword ? `${manuscript.keyword}_${manuscript.localIndex}` : index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {manuscripts.length > 0 && manuscripts[selectedIndex] && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {manuscripts[selectedIndex]?.keyword
                  ? `${manuscripts[selectedIndex].keyword}_${manuscripts[selectedIndex].localIndex} 미리보기`
                  : `원고 ${selectedIndex + 1} 미리보기`}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(getManuscriptContent(manuscripts[selectedIndex]))}
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
                {getManuscriptContent(manuscripts[selectedIndex])}
              </pre>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              글자 수: {getManuscriptContent(manuscripts[selectedIndex]).length.toLocaleString()}자
            </div>
          </div>
        )}

        {manuscripts.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">원고 자동 생성을 시작하세요</h3>
            <p className="text-gray-600">시스템/유저/검토 프롬프트를 입력하고 원고를 한 번에 생성하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualPage;


