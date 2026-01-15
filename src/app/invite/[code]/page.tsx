'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Check, X, AlertCircle, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { CoupleIcon } from '@/components/icons/couple-icon';

type InviteStatus = 'checking' | 'joining' | 'success' | 'error' | 'already_connected' | 'not_logged_in';

function InviteContent() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const inviteCode = params?.code as string;
  const [status, setStatus] = useState<InviteStatus>('checking');
  const [error, setError] = useState('');
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    handleInvite();
  }, []);

  const handleInvite = async () => {
    try {
      setStatus('checking');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus('not_logged_in');
        setTimeout(() => {
          router.push(`/login?redirect=/invite/${inviteCode}`);
        }, 2000);
        return;
      }

      const statusResponse = await fetch('/api/couple/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.connected) {
          setStatus('already_connected');
          setPartnerName(statusData.partner?.name || '배우자');
          return;
        }
      }

      setStatus('joining');
      const response = await fetch('/api/couple/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: inviteCode.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        setStatus('error');
        const errorMessages: Record<string, string> = {
          '유효하지 않은 초대 코드입니다.': '초대 코드를 찾을 수 없습니다',
          '자신의 초대 코드는 사용할 수 없습니다.': '본인이 생성한 코드는 사용할 수 없습니다',
          '이미 다른 사용자와 연결된 초대 코드입니다.': '이미 사용된 초대 코드입니다',
        };
        setError(errorMessages[data.error] || data.error || '커플 연결에 실패했습니다');
      }
    } catch (err) {
      setStatus('error');
      setError('네트워크 오류가 발생했습니다');
      console.error('초대 처리 오류:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* 헤더 로고 */}
      <div className="pt-8 pb-4 text-center">
        <div className="inline-flex items-center justify-center gap-2">
          <CoupleIcon size={32} />
          <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6B9D] via-[#FFA07A] to-[#FFB6A3] bg-clip-text text-transparent">
            같이봄
          </span>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            {status === 'checking' && (
              <div className="space-y-4">
                <Loader2 size={48} className="text-[#3182F6] animate-spin mx-auto" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">초대 확인 중</h2>
                  <p className="text-gray-500 text-sm">초대 코드를 확인하고 있습니다</p>
                </div>
              </div>
            )}

            {status === 'joining' && (
              <div className="space-y-4">
                <Loader2 size={48} className="text-[#FF6B9D] animate-spin mx-auto" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">커플 연결 중</h2>
                  <p className="text-gray-500 text-sm">
                    초대 코드: <span className="font-mono font-semibold text-gray-900">{inviteCode}</span>
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-5">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <Check size={32} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">연결 완료!</h2>
                  <p className="text-gray-600 text-sm">커플 연결이 완료되었습니다</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-green-700 text-sm">
                    이제 배우자와 함께 재무를 관리할 수 있습니다
                  </p>
                </div>
                <p className="text-xs text-gray-400">잠시 후 프로필 페이지로 이동합니다...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-5">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                  <X size={32} className="text-white" strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">연결 실패</h2>
                  <p className="text-gray-600 text-sm">{error}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-left">
                  <p className="text-red-700 text-sm mb-1">
                    초대 코드: <span className="font-mono">{inviteCode}</span>
                  </p>
                  <p className="text-red-600 text-xs">
                    코드가 올바른지 확인하거나 새로운 코드를 요청해주세요
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleInvite}
                    className="w-full py-3 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-semibold transition-colors"
                  >
                    다시 시도
                  </button>
                  <Link href="/profile" className="block">
                    <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
                      프로필로 이동
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {status === 'already_connected' && (
              <div className="space-y-5">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} className="text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">이미 연결됨</h2>
                  <p className="text-gray-600 text-sm">
                    <strong>{partnerName}</strong>님과 연결되어 있습니다
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-amber-800 text-sm">
                    새로운 커플과 연결하려면 현재 연결을 먼저 해제해주세요
                  </p>
                </div>
                <Link href="/profile" className="block">
                  <button className="w-full py-3 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-semibold transition-colors">
                    프로필로 이동
                  </button>
                </Link>
              </div>
            )}

            {status === 'not_logged_in' && (
              <div className="space-y-5">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Lock size={28} className="text-[#3182F6]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">로그인 필요</h2>
                  <p className="text-gray-600 text-sm">커플 연결을 위해 먼저 로그인해주세요</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-blue-800 text-sm">
                    로그인 후 자동으로 커플 연결이 진행됩니다
                  </p>
                </div>
                <p className="text-xs text-gray-400">로그인 페이지로 이동합니다...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="py-6 text-center">
        <p className="text-sm text-gray-400">같이봄에서 함께 재무를 관리하세요</p>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="text-[#3182F6] animate-spin" />
          <p className="text-gray-500 text-sm">로딩 중...</p>
        </div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
