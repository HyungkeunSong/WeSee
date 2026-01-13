'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function CoupleConnectionGuide() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 한 번이라도 가이드를 본 적이 있는지 확인
    const hasSeenGuide = localStorage.getItem('hasSeenCoupleGuide');
    if (!hasSeenGuide) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenCoupleGuide', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4">
        {/* 닫기 버튼 */}
        <div className="flex justify-end mb-2">
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">💑</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            커플 연결 방법
          </h2>
          <p className="text-sm text-gray-600">
            같이봄에서 함께 재무를 관리하려면 커플 연결이 필요해요
          </p>
        </div>

        {/* 단계별 가이드 */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                초대 코드 생성
              </h3>
              <p className="text-sm text-gray-600">
                한 명이 "초대하기" 탭에서 코드를 생성하세요
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                코드 공유하기
              </h3>
              <p className="text-sm text-gray-600">
                카카오톡이나 문자로 배우자에게 코드를 전송하세요
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
              <span className="text-pink-600 font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                코드 입력하기
              </h3>
              <p className="text-sm text-gray-600">
                받은 사람은 "초대받기" 탭에서 코드를 입력하세요
              </p>
            </div>
          </div>
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={handleClose}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all"
        >
          알겠어요!
        </button>

        <p className="text-xs text-center text-gray-500 mt-3">
          이 메시지는 다시 표시되지 않습니다
        </p>
      </div>
    </div>
  );
}
