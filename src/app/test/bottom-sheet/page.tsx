'use client'

import { useState } from 'react'
import { CoupleInviteSheet } from '@/components/couple-invite-sheet'

/**
 * 테스트용 페이지 - 바텀 시트 미리보기
 * URL: /test/bottom-sheet
 * 
 * ⚠️ 배포 전에 삭제하거나 환경변수로 비활성화 필요
 */
export default function TestBottomSheetPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* 테스트 배너 */}
      <div className="bg-amber-100 text-amber-800 text-xs text-center py-2 font-medium">
        🧪 테스트 페이지 - 바텀 시트 미리보기
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
            바텀 시트 테스트
          </h1>

          <button
            onClick={() => setIsSheetOpen(true)}
            className="w-full py-4 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-semibold transition-colors"
          >
            바텀 시트 열기
          </button>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">확인 사항</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ 바텀 시트가 하단 GNB 위에 표시되는가?</li>
              <li>✓ 오버레이가 전체 화면을 덮는가?</li>
              <li>✓ 오버레이 클릭 시 닫히는가?</li>
              <li>✓ X 버튼 클릭 시 닫히는가?</li>
              <li>✓ Safe Area가 잘 적용되는가?</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 하단 GNB (테스트용) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex items-center max-w-lg mx-auto px-2 h-14" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex-1 text-center py-2">
            <div className="text-blue-600 text-xs font-medium">홈</div>
          </div>
          <div className="flex-1 text-center py-2">
            <div className="text-gray-500 text-xs font-medium">업로드</div>
          </div>
          <div className="flex-1 text-center py-2">
            <div className="text-gray-500 text-xs font-medium">소비분석</div>
          </div>
        </div>
      </div>

      {/* 바텀 시트 */}
      <CoupleInviteSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSuccess={() => {
          alert('커플 연결 성공!')
          setIsSheetOpen(false)
        }}
      />

      {/* 테스트 컨트롤 */}
      <div className="fixed top-16 right-4 flex flex-col gap-2">
        <button
          onClick={() => setIsSheetOpen(true)}
          className="px-3 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800"
        >
          🔄 다시 열기
        </button>
      </div>
    </div>
  )
}
