'use client';
import React from 'react';

function MainPage({ getMessage }) {
  const [loading, setLoading] = React.useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const top_p = formData.get('top_p') || 0.95; // 기본값 설정
    const top_k = formData.get('top_k') || 80; // 기본값 설정
    const temperature = formData.get('temperature') || 0.8; // 기본값 설정
    // alert(`top_p: ${top_p}, temperature: ${temperature}`);
    const response = await getMessage({ temperature, top_p, top_k });
    const content = response.content;
    if (response.status === 'error') {
      alert('Error: ' + response.content);
      setLoading(false);
      return;
    }
    setLoading(false);

    // result div에 txt파일 다운로드 할 수 있는 링크 생성
    const resultDiv = document.getElementById('result');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    link.download = `response_${top_p}.txt`;
    link.textContent = '원고 다운로드_' + top_p;
    resultDiv.appendChild(link);

  };

  return (
    <>
    { loading && (
      <div className='fixed inset-0 bg-gray-900/50 bg-opacity-50 flex items-center justify-center z-50'>
        <div className='text-white'>Loading...</div>
      </div>
    ) }
    <form className='max-w-[500px] mx-auto' onSubmit={handleSubmit}>
      {/* <input type='text' name='temperature' placeholder='temperature (0.0 ~ 1.0)' className='border-2 border-gray-300 p-2 rounded-md w-full mb-4' /> */}
      <input type='text' name="top_p" placeholder="top_p (0.0 ~ 1.0)" className='border-2 border-gray-300 p-2 rounded-md w-full mb-4' />
      {/* <input type='text' name="temperature" placeholder="temperature (0.0 ~ 1.0)" className='border-2 border-gray-300 p-2 rounded-md w-full mb-4' /> */}
      <input type='text' name="top_k" placeholder="top_k (0 ~ 100)" className='border-2 border-gray-300 p-2 rounded-md w-full mb-4' />
      <button type='submit' className='bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 cursor-pointer w-[200px] float-right'>Submit</button>
    </form>
    <div id='result' className='flex flex-col gap-4'></div>
    </>
  )
}

export { MainPage };