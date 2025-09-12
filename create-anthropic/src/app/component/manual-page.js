'use client';
import React from 'react';

export const ManualPage = ({ getMessage }) => {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState([]);
  const [resultNumber, setResultNumber] = React.useState(0);

  const systemPromptRef = React.useRef(null);
  const userPromptRef = React.useRef(null);
  const nextMessageRef = React.useRef(null);

  const handleClick = async (type) => {
    setLoading(true);
    const payload = {
      type,
      systemPrompt: systemPromptRef.current?.value || '',
      userPrompt: userPromptRef.current?.value || '',
      message: nextMessageRef.current?.value || '',
    };
    const res = await getMessage(payload);
    if (res.status === 'error') {
      alert('Error: ' + res.content);
      setLoading(false);
      return;
    }
    setResult(prev => [...prev, res.content]);
    setResultNumber(prev => (prev === 0 && prev === result.length ? 0 : prev));
    setLoading(false);
  };

  const downloadFile = (content, index) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `response_${index}.txt`;
    link.textContent = `원고 다운로드_${index}`;
    document.getElementById('result').appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.getElementById('result').removeChild(link);
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-gray-900/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white">Loading...</div>
        </div>
      )}

      <div className="p-10 flex flex-col gap-4 max-w-[1000px]">
        <textarea
          ref={systemPromptRef}
          placeholder="시스템 프롬프트 (system prompt)"
          className="border-2 border-gray-300 p-2 rounded-md w-full h-[200px]"
        />
        <textarea
          ref={userPromptRef}
          placeholder="초기 사용자 프롬프트 (user prompt)"
          className="border-2 border-gray-300 p-2 rounded-md w-full h-[200px]"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleClick('init')}
            className="bg-blue-500 text-white px-4 rounded-md py-2 hover:bg-blue-600 cursor-pointer"
          >
            시작
          </button>
          <input
            type="text"
            ref={nextMessageRef}
            placeholder="다음 메시지 (선택)"
            className="border-2 border-gray-300 p-2 rounded-md w-full max-w-[400px]"
          />
          <button
            onClick={() => handleClick('next')}
            className="bg-green-500 text-white px-4 rounded-md py-2 hover:bg-green-600 cursor-pointer"
          >
            다음
          </button>
        </div>
      </div>

      <div className="border-dotted border-t-2 border-gray-300 mt-10 pt-4">
        <div className="flex gap-4 flex-wrap">
          {result.map((_, index) => (
            <button
              key={index}
              className="bg-gray-200 text-black px-4 py-2 rounded-md hover:bg-gray-300 cursor-pointer"
              onClick={() => setResultNumber(index)}
            >
              {index + 1}번째 원고
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10" id='result'>
        {result[resultNumber] && (
          <div className="bg-white p-4 rounded-md shadow-md">
            <h2 className="text-xl font-bold mb-4">원고 내용</h2>
            <pre className="whitespace-pre-wrap break-words">{result[resultNumber]}</pre>
            <button
              onClick={() => downloadFile(result[resultNumber], resultNumber)}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-4"
            >
              원고 다운로드_{resultNumber + 1}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ManualPage;


