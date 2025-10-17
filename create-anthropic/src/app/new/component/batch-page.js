'use client';
import React from 'react';

export const BatchPage = ({ generateBatch, continueGeneration }) => {
  const [loading, setLoading] = React.useState(false);
  const [manuscripts, setManuscripts] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [copySuccess, setCopySuccess] = React.useState('');
  
  const keywordInput = React.useRef(null);
  const countInput = React.useRef(null);

  const handleGenerate = async () => {
    if (!keywordInput.current.value) {
      alert('키워드를 입력해주세요.');
      return;
    }
    
    const count = parseInt(countInput.current.value) || 10;
    if (count < 1 || count > 20) {
      alert('원고 개수는 1~20 사이로 입력해주세요.');
      return;
    }

    setLoading(true);
    setCopySuccess('');
    
    try {
      const result = await generateBatch({
        keyword: keywordInput.current.value,
        count: count,
        previousManuscripts: manuscripts
      });
      
      if (result.status === 'error') {
        alert('오류: ' + result.message);
      } else {
        setManuscripts(result.manuscripts);
        setSelectedIndex(0);
      }
    } catch (error) {
      alert('생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    if (manuscripts.length === 0) {
      alert('먼저 원고를 생성해주세요.');
      return;
    }

    const count = parseInt(countInput.current.value) || 10;
    if (count < 1 || count > 20) {
      alert('원고 개수는 1~20 사이로 입력해주세요.');
      return;
    }

    setLoading(true);
    setCopySuccess('');
    
    try {
      const result = await continueGeneration({
        keyword: keywordInput.current.value,
        count: count,
        previousManuscripts: manuscripts
      });
      
      if (result.status === 'error') {
        alert('오류: ' + result.message);
      } else {
        setManuscripts([...manuscripts, ...result.manuscripts]);
        setSelectedIndex(manuscripts.length);
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
      setCopySuccess('클립보드에 복사되었습니다!');
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
      setManuscripts([]);
      setSelectedIndex(0);
      setCopySuccess('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {loading && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">원고 생성 중...</div>
            <div className="text-sm text-gray-500 mt-2">시간이 걸릴 수 있습니다.</div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* 입력 영역 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">원고 생성 설정</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메인 키워드
              </label>
              <input
                type="text"
                ref={keywordInput}
                placeholder="예: 갈비 창업 브랜드"
                className="w-full border-2 border-gray-300 p-3 rounded-md focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                생성할 원고 개수 (1~10 권장)
              </label>
              <input
                type="number"
                ref={countInput}
                defaultValue={5}
                min={1}
                max={20}
                className="w-full border-2 border-gray-300 p-3 rounded-md focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ 5~7개를 권장합니다. 많을수록 시간이 오래 걸립니다.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              🚀 새로 생성
            </button>
            <button
              onClick={handleContinue}
              disabled={loading || manuscripts.length === 0}
              className="flex-1 bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              ➕ 계속 생성
            </button>
            <button
              onClick={clearAll}
              disabled={loading || manuscripts.length === 0}
              className="bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              🗑️ 전체 삭제
            </button>
          </div>

          {manuscripts.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800 font-medium">
                  총 {manuscripts.length}개의 원고가 생성되었습니다.
                </span>
                <button
                  onClick={downloadAllManuscripts}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
                ✅ {copySuccess}
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
            <p className="text-gray-600">
              키워드와 개수를 입력한 후 "새로 생성" 버튼을 클릭하세요.
            </p>
            <div className="mt-6 text-left max-w-2xl mx-auto space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-bold text-blue-900 mb-2">✨ 주요 기능</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 한 번에 여러 원고 동시 생성 (5~7개 권장)</li>
                  <li>• 각 원고는 서로 겹치지 않는 표현으로 작성</li>
                  <li>• 클립보드 복사로 간편하게 사용</li>
                  <li>• "계속 생성"으로 추가 원고 생성 (이전 원고와 비교하여 중복 제거)</li>
                  <li>• 특수문자 자동 제거 (', ", **, `)</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-2">💡 사용 팁</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• <strong>처음에는 5개</strong>로 시작해서 품질 확인</li>
                  <li>• 만족하면 <strong>"계속 생성"</strong>으로 추가</li>
                  <li>• 한 번에 너무 많이 생성하면 시간이 오래 걸림</li>
                  <li>• API 오류 발생 시 개수를 줄여서 재시도</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

