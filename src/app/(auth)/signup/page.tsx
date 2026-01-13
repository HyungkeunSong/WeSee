'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { CoupleIcon } from '@/components/icons/couple-icon'
import { KeyIcon } from '@/components/icons/key-icon'

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
    // 리다이렉트 URL이 있으면 해당 페이지로, 없으면 홈으로
    router.push(redirectUrl || '/')
    router.refresh()
  }

  // 커플 연결 성공 화면
  if (joinSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* 성공 메시지 */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                연결 완료!
              </h1>
              <p className="text-lg text-zinc-600 font-medium">배우자와 연결되었어요 💑</p>
            </div>

            {/* 안내 카드 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <div className="text-center">
                <p className="text-zinc-700 text-lg font-medium mb-6">
                  이제 함께 가계부를 사용할 수 있어요! 🎉
                </p>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
                  <p className="text-sm text-purple-900 font-medium leading-relaxed">
                    💡 홈 화면에서 두 분의<br />
                    재무 내역을 함께 볼 수 있습니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 시작하기 버튼 */}
        <div className="sticky bottom-0 p-6 pb-8 bg-white/80 backdrop-blur-sm border-t border-zinc-200">
          <button
            onClick={handleContinue}
            className="w-full max-w-md mx-auto block py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white rounded-2xl font-bold text-lg transition-all shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            시작하기 ✨
          </button>
        </div>
      </div>
    )
  }

  // 초대 코드 입력 화면
  if (showJoinInput) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* 뒤로가기 버튼 */}
        <div className="p-4">
          <button
            onClick={() => {
              setShowJoinInput(false)
              setError('')
              setJoinCode('')
            }}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* 헤더 */}
            <div className="text-center space-y-3">
              <div className="flex justify-center mb-4">
                <KeyIcon size={56} className="animate-bounce" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                초대 코드 입력
              </h1>
              <p className="text-lg text-zinc-600 font-medium">배우자에게 받은 코드를 입력하세요</p>
            </div>

            {/* 입력 카드 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="예: A3K7M9"
                maxLength={6}
                className="w-full px-4 py-4 text-center text-3xl font-bold tracking-[0.3em] border-2 border-purple-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all uppercase bg-white placeholder:text-zinc-300"
              />

              <button
                onClick={handleJoinCouple}
                disabled={joinCode.length !== 6 || isJoining}
                className="w-full mt-6 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
              >
                {isJoining ? '연결 중...' : '연결하기 💕'}
              </button>

              {error && (
                <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium mt-4">
                  {error}
                </div>
              )}

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-5 mt-6 border border-purple-100">
                <p className="text-xs text-purple-900 font-medium leading-relaxed">
                  💡 배우자가 먼저 앱을 설치하고<br />
                  초대 코드를 생성한 후 공유해야 합니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 회원가입 성공 화면
  if (showSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* 성공 메시지 */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                회원가입 완료!
              </h1>
              <p className="text-lg text-zinc-600 font-medium">환영합니다 🎉</p>
            </div>

            {/* 배우자 연결 선택 카드 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-2">
                  배우자와 연결하시나요?
                </h2>
                <p className="text-sm text-zinc-600 font-medium">
                  아래에서 선택해주세요
                </p>
              </div>

              {/* 초대 코드 생성하기 버튼 */}
              <button
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="w-full mb-3 py-5 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-2xl font-bold transition-all flex items-center gap-3 shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <div className="text-left flex-1">
                  <div className="text-base">초대 코드 생성하기 🔑</div>
                  <div className="text-xs opacity-90">내가 먼저 시작했어요</div>
                </div>
              </button>

              {/* 초대 코드 입력하기 버튼 */}
              <button
                onClick={() => {
                  setShowJoinInput(true)
                  setShowSuccess(false)
                }}
                className="w-full py-5 px-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-bold transition-all flex items-center gap-3 shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <div className="text-left flex-1">
                  <div className="text-base">초대 코드 입력하기 💌</div>
                  <div className="text-xs opacity-90">받은 코드가 있어요</div>
                </div>
              </button>

              {error && (
                <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium mt-4">
                  {error}
                </div>
              )}

              {/* 안내 문구 */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 mt-6 border border-purple-100">
                <p className="text-xs text-purple-900 font-medium text-center leading-relaxed">
                  💡 나중에 프로필 페이지에서도<br />
                  언제든 연결할 수 있어요
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 나중에 하기 버튼 - 하단 고정 */}
        <div className="sticky bottom-0 p-6 pb-8 bg-white/80 backdrop-blur-sm border-t border-zinc-200">
          <button
            onClick={handleContinue}
            className="w-full max-w-md mx-auto block py-5 bg-gradient-to-r from-zinc-700 to-zinc-900 hover:from-zinc-800 hover:to-black text-white rounded-2xl font-bold text-lg transition-all shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            나중에 하기
          </button>
        </div>
      </div>
    )
  }

  // 초대 코드 공유 화면
  if (showInviteCode) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* 성공 메시지 */}
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                초대 코드 생성 완료!
              </h1>
              <p className="text-lg text-zinc-600 font-medium">환영합니다 🎉</p>
            </div>

            {/* 초대 코드 카드 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <div className="text-center">
                <p className="text-base text-zinc-700 font-semibold mb-6">
                  배우자에게 이 코드를 공유하세요 💌
                </p>
                
                {/* 초대 코드 */}
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-8 mb-6 border-2 border-purple-200 shadow-inner">
                  <p className="text-sm text-purple-700 font-semibold mb-3">내 초대 코드</p>
                  <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-[0.3em] mb-2">{inviteCode}</p>
                </div>

                {/* 복사 버튼 */}
                <button
                  onClick={copyInviteCode}
                  className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${
                    copySuccess
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                  }`}
                >
                  {copySuccess ? '✓ 복사완료!' : '초대 코드 복사하기 📋'}
                </button>

                {/* 안내 문구 */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-5 mt-6 border border-purple-100">
                  <p className="text-xs text-purple-900 font-medium leading-relaxed">
                    💡 <strong>햄버거 메뉴</strong> → <strong>내 프로필</strong>에서<br />
                    초대 코드를 다시 확인할 수 있습니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 시작하기 버튼 - 하단 고정 (모바일 엄지 클릭 최적화) */}
        <div className="sticky bottom-0 p-6 pb-8 bg-white/80 backdrop-blur-sm border-t border-zinc-200">
          <button
            onClick={handleContinue}
            className="w-full max-w-md mx-auto block py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white rounded-2xl font-bold text-lg transition-all shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            시작하기 ✨
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}>
      <div className="w-full max-w-md space-y-8">
        {/* 로고 & 타이틀 */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-2">
            <CoupleIcon size={56} className="animate-pulse" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              같이봄
            </h1>
          </div>
          <p className="text-lg text-zinc-600 font-medium">부부의 자산을 함께 봐요</p>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-zinc-800 mb-2">
                이름
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all placeholder:text-zinc-400"
                placeholder="홍길동"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-zinc-800 mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all placeholder:text-zinc-400"
                placeholder="your@email.com"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-zinc-800 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all placeholder:text-zinc-400"
                placeholder="6자 이상"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-zinc-800 mb-2">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl border-2 border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all placeholder:text-zinc-400"
                placeholder="비밀번호 재입력"
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg mt-6"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center text-sm">
            <span className="text-zinc-600">이미 계정이 있으신가요?</span>{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold underline decoration-2 underline-offset-2">
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}>
        <div className="text-center">
          <CoupleIcon size={56} className="animate-pulse mx-auto mb-4" />
          <p className="text-zinc-600">로딩 중...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
