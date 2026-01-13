'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CoupleIcon } from '@/components/icons/couple-icon'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // 리다이렉트 URL 가져오기
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
        // 리다이렉트 URL이 있으면 해당 페이지로, 없으면 홈으로
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

        {/* 로그인 폼 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
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
                placeholder="••••••••"
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center text-sm">
            <span className="text-zinc-600">아직 계정이 없으신가요?</span>{' '}
            <Link href="/signup" className="text-purple-600 hover:text-purple-700 font-semibold underline decoration-2 underline-offset-2">
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}>
        <div className="text-center">
          <CoupleIcon size={56} className="animate-pulse mx-auto mb-4" />
          <p className="text-zinc-600">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
