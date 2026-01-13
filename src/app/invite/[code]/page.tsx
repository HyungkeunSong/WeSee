'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type InviteStatus = 'checking' | 'joining' | 'success' | 'error' | 'already_connected' | 'not_logged_in';

export const dynamic = 'force-dynamic'

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const inviteCode = params.code as string;
  const [status, setStatus] = useState<InviteStatus>('checking');
  const [error, setError] = useState('');
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    handleInvite();
  }, []);

  const handleInvite = async () => {
    try {
      // 1. 로그인 상태 확인
      setStatus('checking');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus('not_logged_in');
        // 로그인 후 다시 이 페이지로 돌아오도록 설정
        setTimeout(() => {
          router.push(`/login?redirect=/invite/${inviteCode}`);
        }, 2000);
        return;
      }

      // 2. 이미 연결된 커플이 있는지 확인
      const statusResponse = await fetch('/api/couple/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.connected) {
          setStatus('already_connected');
          setPartnerName(statusData.partner?.name || '배우자');
          return;
        }
      }

      // 3. 초대 코드로 커플 연결 시도
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
        // 3초 후 프로필 페이지로 이동
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      } else {
        setStatus('error');
        
        // 에러 메시지 개선
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 카드 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {status === 'checking' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Loader2 size={64} className="text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                초대 확인 중...
              </h2>
              <p className="text-gray-600">
                초대 코드를 확인하고 있습니다
              </p>
            </div>
          )}

          {status === 'joining' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Loader2 size={64} className="text-purple-600 animate-spin" />
                  <Heart size={32} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-pink-500 animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                커플 연결 중...
              </h2>
              <p className="text-gray-600">
                초대 코드: <span className="font-mono font-bold text-purple-600">{inviteCode}</span>
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6 animate-in zoom-in">
              <div className="flex justify-center">
                <div className="relative">
                  <CheckCircle size={80} className="text-green-500" />
                  <div className="absolute inset-0 animate-ping">
                    <CheckCircle size={80} className="text-green-500 opacity-30" />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  🎉 연결 완료!
                </h2>
                <p className="text-lg text-gray-600">
                  커플 연결이 성공적으로 완료되었습니다
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-green-700 text-sm">
                  이제 배우자와 함께 재무를 관리할 수 있습니다
                </p>
              </div>
              <div className="text-sm text-gray-500">
                잠시 후 프로필 페이지로 이동합니다...
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <XCircle size={80} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  연결 실패
                </h2>
                <p className="text-gray-600">
                  {error}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-700 text-sm mb-2">
                  <strong>초대 코드:</strong> <span className="font-mono">{inviteCode}</span>
                </p>
                <p className="text-red-600 text-xs">
                  초대 코드가 올바른지 확인하거나 배우자에게 새로운 코드를 요청해주세요
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={handleInvite}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                >
                  다시 시도
                </button>
                <Link href="/profile">
                  <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all">
                    프로필로 이동
                  </button>
                </Link>
              </div>
            </div>
          )}

          {status === 'already_connected' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">💑</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  이미 연결되어 있습니다
                </h2>
                <p className="text-gray-600">
                  현재 <strong>{partnerName}</strong>님과 연결되어 있습니다
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-amber-800 text-sm">
                  새로운 커플과 연결하려면 먼저 현재 연결을 해제해야 합니다
                </p>
              </div>
              <Link href="/profile">
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all">
                  프로필로 이동
                </button>
              </Link>
            </div>
          )}

          {status === 'not_logged_in' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🔐</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  로그인이 필요합니다
                </h2>
                <p className="text-gray-600">
                  커플 연결을 위해 먼저 로그인해주세요
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-blue-800 text-sm">
                  로그인 후 자동으로 커플 연결이 진행됩니다
                </p>
              </div>
              <div className="text-sm text-gray-500">
                로그인 페이지로 이동합니다...
              </div>
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            같이봄에서 함께 재무를 관리하세요 💝
          </p>
        </div>
      </div>
    </div>
  );
}
