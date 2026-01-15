'use client'

import { useState, useEffect } from 'react'
import { X, UserPlus, Key, Copy, Check, Loader2 } from 'lucide-react'

interface CoupleInviteSheetProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type SheetStep = 'select' | 'generate' | 'join'

export function CoupleInviteSheet({ isOpen, onClose, onSuccess }: CoupleInviteSheetProps) {
  const [step, setStep] = useState<SheetStep>('select')
  const [inviteCode, setInviteCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState('')

  // 시트가 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('select')
        setInviteCode('')
        setJoinCode('')
        setError('')
        setCopySuccess(false)
      }, 300)
    }
  }, [isOpen])

  const handleGenerateCode = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/couple/create-invite', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setInviteCode(data.inviteCode)
        setStep('generate')
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
        setError(errorData.error || '초대 코드 생성에 실패했습니다.')
      }
    } catch {
      setError('초대 코드 생성에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinCouple = async () => {
    if (joinCode.length !== 6) return
    
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinCode.toUpperCase() }),
      })

      if (response.ok) {
        onSuccess?.()
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류' }))
        setError(errorData.error || '커플 연결에 실패했습니다.')
      }
    } catch {
      setError('커플 연결에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      // 클립보드 API 실패 시 폴백
      const textArea = document.createElement('textarea')
      textArea.value = inviteCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* 오버레이 */}
      <div 
        className="fixed inset-0 bg-black/40 z-[100] transition-opacity"
        onClick={onClose}
      />

      {/* 바텀 시트 */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-3xl transition-transform duration-300 ease-out"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)'
        }}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 'select' && '배우자와 연결하기'}
            {step === 'generate' && '초대 코드'}
            {step === 'join' && '코드 입력'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="px-5 pb-6">
          {/* 선택 화면 */}
          {step === 'select' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                배우자와 연결하여 함께 재무를 관리하세요
              </p>

              {/* 초대 코드 생성 */}
              <button
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-4 text-left"
              >
                <div className="w-12 h-12 bg-[#3182F6] rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">초대 코드 생성</div>
                  <div className="text-sm text-gray-500">내가 먼저 시작하기</div>
                </div>
                {isLoading && <Loader2 size={20} className="text-gray-400 animate-spin" />}
              </button>

              {/* 초대 코드 입력 */}
              <button
                onClick={() => setStep('join')}
                className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-4 text-left"
              >
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <Key size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">코드 입력하기</div>
                  <div className="text-sm text-gray-500">받은 코드가 있어요</div>
                </div>
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* 초대 코드 생성 완료 화면 */}
          {step === 'generate' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                아래 코드를 배우자에게 공유하세요
              </p>

              {/* 코드 표시 */}
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <p className="text-3xl font-bold text-gray-900 tracking-[0.3em] font-mono">
                  {inviteCode}
                </p>
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
                    코드 복사하기
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                프로필 페이지에서 다시 확인할 수 있어요
              </p>
            </div>
          )}

          {/* 코드 입력 화면 */}
          {step === 'join' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                배우자에게 받은 6자리 코드를 입력하세요
              </p>

              {/* 코드 입력 */}
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent transition-colors uppercase bg-gray-50 placeholder:text-gray-300 font-mono"
              />

              {/* 연결 버튼 */}
              <button
                onClick={handleJoinCouple}
                disabled={joinCode.length !== 6 || isLoading}
                className="w-full py-3 bg-[#3182F6] hover:bg-[#1C6DD0] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-semibold transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    연결 중...
                  </span>
                ) : '연결하기'}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* 뒤로가기 */}
              <button
                onClick={() => {
                  setStep('select')
                  setJoinCode('')
                  setError('')
                }}
                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                다른 방법 선택
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
