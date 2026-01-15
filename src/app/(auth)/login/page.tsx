'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CoupleIcon } from '@/components/icons/couple-icon'
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const redirectUrl = searchParams?.get('redirect')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        router.push(redirectUrl || '/home')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
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

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
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
                placeholder="이메일을 입력하세요"
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
                placeholder="비밀번호를 입력하세요"
                aria-label="비밀번호"
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3182F6] hover:bg-[#1C6DD0] disabled:bg-[#93C5FD] text-white font-semibold py-4 rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">아직 계정이 없으신가요?</span>{' '}
            <Link href="/signup" className="text-[#3182F6] hover:text-[#1C6DD0] font-semibold">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}>
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#3182F6] mx-auto mb-4" />
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
