'use client'

import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * 테스트용 페이지 - 회원가입 성공 화면 미리보기
 * URL: /test/signup-success
 * 
 * ⚠️ 배포 전에 삭제하거나 환경변수로 비활성화 필요
 */
export default function TestSignupSuccessPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* 테스트 배너 */}
      <div className="bg-amber-100 text-amber-800 text-xs text-center py-2 font-medium">
        🧪 테스트 페이지 - 실제 회원가입 성공 화면 프리뷰
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-6">
          {/* 성공 아이콘 - 귀여운 인터랙션 */}
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-success-pop">
            <Check size={48} className="text-white animate-check-draw" strokeWidth={3} />
          </div>

          {/* 성공 메시지 */}
          <div className="space-y-2 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-gray-900">
              회원가입 완료!
            </h1>
            <p className="text-lg text-gray-500">
              같이봄에 오신 것을 환영합니다
            </p>
          </div>
        </div>

      </div>

      {/* 시작하기 버튼 - 하단 고정 */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 pt-8"
        style={{ 
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, white 70%, transparent)'
        }}
      >
        <button
          onClick={() => router.push('/')}
          className="w-full max-w-md mx-auto block py-4 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-semibold transition-colors"
        >
          시작하기
        </button>
      </div>

      {/* 테스트 컨트롤 */}
      <div className="fixed top-16 right-4 flex flex-col gap-2">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800"
        >
          🔄 다시 재생
        </button>
      </div>
    </div>
  )
}
