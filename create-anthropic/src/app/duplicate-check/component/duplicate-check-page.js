'use client';
import React from 'react';

export const DuplicateCheckPage = ({ findDuplicates, applyTransforms }) => {
  const [loading, setLoading] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [modifiedFiles, setModifiedFiles] = React.useState([]);
  const [duplicates, setDuplicates] = React.useState([]);
  const [copySuccess, setCopySuccess] = React.useState('');
  const [selectedFileIndex, setSelectedFileIndex] = React.useState(0);
  const [excludeStrings, setExcludeStrings] = React.useState('');
  
  const fileInput = React.useRef(null);

  // 파일 선택 핸들러
  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (selectedFiles.length === 0) {
      alert('파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      const filesData = await Promise.all(
        selectedFiles.map(async (file) => {
          const content = await file.text();
          return {
            name: file.name,
            content: content
          };
        })
      );

      setFiles(filesData);
      setModifiedFiles([]);
      setSelectedFileIndex(0);
      setCopySuccess('');
    } catch (error) {
      alert('파일 읽기 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 중복 검사만 실행 (변환 전)
  const handleFindDuplicates = async () => {
    if (files.length === 0) {
      alert('먼저 파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setCopySuccess('');
    
    try {
      // 제외할 문자열 파싱 (쉼표 또는 줄바꿈으로 구분)
      const excludeList = excludeStrings
        .split(/[,\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      const result = await findDuplicates({ 
        files,
        excludeStrings: excludeList
      });
      
      if (result.status === 'error') {
        alert('오류: ' + result.message);
      } else {
        setDuplicates(result.duplicates);
        setModifiedFiles([]);
      }
    } catch (error) {
      alert('중복 검사 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 실제 변환 실행
  const handleApplyTransforms = async () => {
    if (files.length === 0) {
      alert('먼저 파일을 선택해주세요.');
      return;
    }

    if (duplicates.length === 0) {
      alert('먼저 중복 검사를 실행해주세요.');
      return;
    }

    setLoading(true);
    setCopySuccess('');
    
    try {
      // 제외할 문자열 파싱 (쉼표 또는 줄바꿈으로 구분)
      const excludeList = excludeStrings
        .split(/[,\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      const result = await applyTransforms({ 
        files,
        excludeStrings: excludeList
      });
      
      if (result.status === 'error') {
        alert('오류: ' + result.message);
      } else {
        // 1) 수정본 반영
        setModifiedFiles(result.files);
        setSelectedFileIndex(0);
        setFiles(result.files);

        // 2) 최신 파일 기준으로 중복 재검사 → 테이블 갱신
        const rerun = await findDuplicates({
          files: result.files,
          excludeStrings: excludeList
        });
        if (rerun.status === 'success') {
          setDuplicates(rerun.duplicates);
        }
      }
    } catch (error) {
      alert('변환 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 클립보드 복사
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('✅ 클립보드에 복사되었습니다!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (err) {
      alert('복사 실패: ' + err.message);
    }
  };

  // 파일 다운로드
  const downloadFile = (file, index) => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `수정된_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 모든 수정된 파일 다운로드
  const downloadAllModifiedFiles = () => {
    modifiedFiles.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file, index);
      }, index * 100);
    });
  };

  // 전체 초기화
  const clearAll = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
      setFiles([]);
      setModifiedFiles([]);
      setDuplicates([]);
      setSelectedFileIndex(0);
      setCopySuccess('');
      setExcludeStrings('');
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 로딩 오버레이 */}
      {loading && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-semibold text-gray-700">처리 중...</div>
            <div className="text-sm text-gray-500 mt-2">잠시만 기다려주세요.</div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* 제목 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🔍 중복 검사 도구
          </h1>
          <p className="text-gray-600">
            텍스트 파일들의 중복 문장을 검사하고 자동으로 수정합니다
          </p>
        </div>

        {/* 파일 업로드 영역 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              텍스트 파일 선택 (여러 개 선택 가능)
            </label>
            <input
              type="file"
              ref={fileInput}
              onChange={handleFileSelect}
              multiple
              accept=".txt"
              className="w-full border-2 border-gray-300 p-3 rounded-md focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 여러 파일을 동시에 선택하여 중복 검사를 수행합니다.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제외할 문자열 (선택사항)
            </label>
            <textarea
              value={excludeStrings}
              onChange={(e) => setExcludeStrings(e.target.value)}
              placeholder="비교 대상에서 제외할 문자열을 입력하세요&#10;예: 제목, 브랜드명, 키워드 등&#10;(여러 개는 쉼표 또는 줄바꿈으로 구분)"
              className="w-full border-2 border-gray-300 p-3 rounded-md focus:border-blue-500 focus:outline-none h-24"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 숫자만 있는 줄(1, 20 등)은 자동으로 제외됩니다. 추가로 제외할 문자열을 입력하세요.
            </p>
          </div>


          {files.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800 font-medium">
                  선택된 파일: {files.length}개
                </span>
                <button
                  onClick={clearAll}
                  className="text-sm bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                >
                  🗑️ 전체 삭제
                </button>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                {files.map((file, index) => (
                  <div key={index} className="truncate">
                    {file.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleFindDuplicates}
              disabled={loading || files.length === 0}
              className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              🔍 중복 검사
            </button>
            <button
              onClick={handleApplyTransforms}
              disabled={loading || files.length === 0 || duplicates.length === 0}
              className="flex-1 bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              ✨ 변환 실행
            </button>
          </div>
        </div>

        {/* 파일 목록 */}
        {files.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">업로드된 원본 파일</h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {files.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedFileIndex(index);
                    setCopySuccess('');
                  }}
                  className={`p-3 rounded-md font-semibold transition-colors ${
                    selectedFileIndex === index
                      ? 'bg-gray-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 중복 검사 결과 테이블 */}
        {duplicates.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              중복 검사 결과 ({duplicates.length}개)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-3 text-left font-semibold text-gray-700 w-12">번호</th>
                    <th className="p-3 text-left font-semibold text-gray-700">문장</th>
                    <th className="p-3 text-left font-semibold text-gray-700">파일명</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicates.map((dup, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-600 font-semibold">{dup.id}</td>
                      <td className="p-3 text-gray-800">{dup.sentence}</td>
                      <td className="p-3 text-gray-600">
                        {dup.files.join(', ')} ({dup.count}개 파일)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
              💡 총 {duplicates.length}개의 중복 문장이 발견되었습니다. 
              "변환 실행" 버튼을 클릭하여 중복 문장을 수정하세요.
            </div>
          </div>
        )}

        {/* 수정된 파일 목록 */}
        {modifiedFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">수정된 파일</h2>
              <button
                onClick={downloadAllModifiedFiles}
                className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-semibold"
              >
                📥 전체 다운로드
              </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {modifiedFiles.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedFileIndex(index);
                    setCopySuccess('');
                  }}
                  className={`p-3 rounded-md font-semibold transition-colors ${
                    selectedFileIndex === index
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  수정 {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 파일 미리보기 */}
        {files.length > 0 && files[selectedFileIndex] && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {modifiedFiles.length > 0 ? '수정된 파일' : '원본 파일'} {selectedFileIndex + 1} 미리보기
              </h2>
              {modifiedFiles.length > 0 && modifiedFiles[selectedFileIndex] && (
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(modifiedFiles[selectedFileIndex].content)}
                    className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors font-semibold"
                  >
                    📋 복사
                  </button>
                  <button
                    onClick={() => downloadFile(modifiedFiles[selectedFileIndex], selectedFileIndex)}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors font-semibold"
                  >
                    💾 다운로드
                  </button>
                </div>
              )}
            </div>

            {copySuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md font-medium">
                {copySuccess}
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-md border border-gray-200 max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed font-sans">
                {modifiedFiles.length > 0 && modifiedFiles[selectedFileIndex]
                  ? modifiedFiles[selectedFileIndex].content
                  : files[selectedFileIndex].content}
              </pre>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              파일명: {files[selectedFileIndex].name} | 
              글자 수: {(modifiedFiles.length > 0 && modifiedFiles[selectedFileIndex]
                ? modifiedFiles[selectedFileIndex].content
                : files[selectedFileIndex].content).length.toLocaleString()}자
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        {files.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              중복 검사를 시작하세요
            </h3>
            <p className="text-gray-600 mb-6">
              텍스트 파일들을 업로드한 후 중복 검사 버튼을 클릭하세요.
            </p>
            
            <div className="mt-6 text-left max-w-2xl mx-auto space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-bold text-blue-900 mb-2">✨ 주요 기능</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 여러 텍스트 파일을 한 번에 업로드하여 중복 검사</li>
                  <li>• 중복되는 문장을 자동으로 찾아 수정</li>
                  <li>• 수정된 파일들을 일괄 다운로드</li>
                  <li>• 자연스러운 문장 변형으로 의미 유지</li>
                  <li>• 숫자만 있는 줄(1, 20 등) 자동 제외</li>
                  <li>• 사용자 정의 문자열 제외 기능</li>
                  <li>• 키워드 보호 기능 (예: "초보 창업 추천")</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-2">💡 사용 팁</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• .txt 형식의 텍스트 파일만 업로드 가능</li>
                  <li>• 여러 파일을 동시에 선택 가능</li>
                  <li>• 중복 검사 후 수정된 파일 미리보기 가능</li>
                  <li>• 수정된 모든 파일을 한 번에 다운로드 가능</li>
                  <li>• 제외할 문자열을 입력하면 해당 문장은 비교 대상에서 제외</li>
                  <li>• 보호할 문자열을 입력하면 해당 키워드가 대체 문장에도 반드시 포함됨</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

