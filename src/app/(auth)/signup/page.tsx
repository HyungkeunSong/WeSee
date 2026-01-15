'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Loader2, Check, ChevronLeft, Copy, Key } from 'lucide-react'
import { CoupleIcon } from '@/components/icons/couple-icon'

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInviteCode, setShowInviteCode] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // 리다이렉트 URL 가져오기
  const redirectUrl = searchParams?.get('redirect')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name, // 사용자 이름을 메타데이터로 저장
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // 회원가입 성공 - 성공 화면 표시 (초대 코드는 버튼 클릭 시 생성)
        setShowSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true)
    setError('')
    
    try {
      const response = await fetch('/api/couple/create-invite', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setInviteCode(data.inviteCode)
        setShowInviteCode(true)
        setShowSuccess(false)
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
        setError(errorData.error || '초대 코드 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('초대 코드 생성 오류:', error)
      setError('초대 코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('복사 오류:', error)
    }
  }

  const handleJoinCouple = async () => {
    if (joinCode.length !== 6) {
      setError('초대 코드는 6자리여야 합니다.')
      return
    }

    setIsJoining(true)
    setError('')

    try {
      const response = await fetch('/api/couple/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteCode: joinCode }),
      })

      if (response.ok) {
        const data = await response.json()
        setJoinSuccess(true)
        setShowJoinInput(false)
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
        setError(errorData.error || '초대 코드 입력에 실패했습니다.')
      }
    } catch (error) {
      console.error('커플 연결 오류:', error)
      setError('연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleContinue = () => {
    // 회원가입 직후 홈에서 바텀시트가 표시되도록 localStorage 초기화
    localStorage.removeItem('hasSeenInviteSheet')
    localStorage.removeItem('currentMonth')
    
    // 리다이렉트 URL이 있으면 해당 페이지로, 없으면 홈으로
    router.push(redirectUrl || '/')
    router.refresh()
  }

  // 커플 연결 성공 화면
  if (joinSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">
            {/* 성공 메시지 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} className="text-white" strokeWidth={3} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                연결 완료!
              </h1>
              <p className="text-gray-600">배우자와 연결되었습니다</p>
            </div>

            {/* 안내 카드 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  이제 함께 가계부를 사용할 수 있어요
                </p>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    홈 화면에서 두 분의 재무 내역을 함께 볼 수 있습니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 시작하기 버튼 */}
        <div className="sticky bottom-0 p-4 pb-8 bg-white border-t border-gray-100" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleContinue}
            className="w-full max-w-md mx-auto block py-4 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-semibold transition-colors"
          >
            시작하기
          </button>
        </div>
      </div>
    )
  }

  // 초대 코드 입력 화면
  if (showJoinInput) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* 뒤로가기 버튼 */}
        <div className="p-4">
          <button
            onClick={() => {
              setShowJoinInput(false)
              setError('')
              setJoinCode('')
            }}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">뒤로</span>
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-6">
            {/* 헤더 */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#FF6B9D] rounded-full flex items-center justify-center mx-auto mb-4">
                <Key size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                초대 코드 입력
              </h1>
              <p className="text-gray-600">배우자에게 받은 코드를 입력하세요</p>
            </div>

            {/* 입력 카드 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent transition-colors uppercase bg-gray-50 placeholder:text-gray-300"
              />

              <button
                onClick={handleJoinCouple}
                disabled={joinCode.length !== 6 || isJoining}
                className="w-full mt-4 py-4 bg-[#3182F6] hover:bg-[#1C6DD0] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
              >
                {isJoining ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    연결 중...
                  </span>
                ) : '연결하기'}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 mt-4">
                  {error}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 mt-4">
                <p className="text-xs text-gray-600 text-center">
                  배우자가 먼저 앱을 설치하고 초대 코드를 생성한 후 공유해야 합니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 회원가입 성공 화면 - 간소화
  if (showSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
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
            onClick={handleContinue}
            className="w-full max-w-md mx-auto block py-4 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-semibold transition-colors"
          >
            시작하기
          </button>
        </div>
      </div>
    )
  }

  // 초대 코드 공유 화면
  if (showInviteCode) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-6">
            {/* 성공 메시지 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} className="text-white" strokeWidth={3} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                초대 코드 생성 완료!
              </h1>
              <p className="text-gray-600">배우자에게 이 코드를 공유하세요</p>
            </div>

            {/* 초대 코드 카드 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-center">
                {/* 초대 코드 */}
                <div className="bg-gray-50 rounded-xl p-6 mb-4">
                  <p className="text-xs text-gray-500 mb-2">내 초대 코드</p>
                  <p className="text-4xl font-bold text-gray-900 tracking-[0.3em] font-mono">{inviteCode}</p>
                </div>

                {/* 복사 버튼 */}
                <button
                  onClick={copyInviteCode}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    copySuccess
                      ? 'bg-green-500 text-white'
                      : 'bg-[#3182F6] hover:bg-[#1C6DD0] text-white'
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <Check size={18} />
                      복사 완료
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      초대 코드 복사하기
                    </>
                  )}
                </button>

                {/* 안내 문구 */}
                <div className="bg-gray-50 rounded-xl p-3 mt-4">
                  <p className="text-xs text-gray-500">
                    메뉴 → 내 프로필에서 초대 코드를 다시 확인할 수 있습니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 시작하기 버튼 */}
        <div className="sticky bottom-0 p-4 pb-8 bg-white border-t border-gray-100" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleContinue}
            className="w-full max-w-md mx-auto block py-4 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-semibold transition-colors"
          >
            시작하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}>
      <div className="w-full max-w-md space-y-8">
        {/* 로고 & 타이틀 */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-3">
            <CoupleIcon size={56} />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              같이봄
            </h1>
          </div>
          <p className="text-lg text-gray-600">부부의 자산을 함께 봐요</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent transition-colors placeholder:text-gray-500"
                placeholder="이름을 입력하세요"
                aria-label="이름"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent transition-colors placeholder:text-gray-500"
                placeholder="이메일을 입력하세요 (예: hong@email.com)"
                aria-label="이메일"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent transition-colors placeholder:text-gray-500"
                placeholder="비밀번호 (6자 이상)"
                aria-label="비밀번호"
                minLength={6}
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent transition-colors placeholder:text-gray-500"
                placeholder="비밀번호를 다시 입력하세요"
                aria-label="비밀번호 확인"
                minLength={6}
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3182F6] hover:bg-[#1C6DD0] disabled:bg-[#93C5FD] text-white font-semibold py-4 rounded-xl transition-colors disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  가입 중...
                </span>
              ) : '회원가입'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">이미 계정이 있으신가요?</span>{' '}
            <Link href="/login" className="text-[#3182F6] hover:text-[#1C6DD0] font-semibold">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}>
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#3182F6] mx-auto mb-4" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
