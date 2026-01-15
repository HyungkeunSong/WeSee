'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Copy, Check, UserPlus, Camera, Share2, Send, Clock } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { CoupleConnectionGuide } from '@/components/couple-connection-guide';

type InviteMode = 'create' | 'join';

export default function ProfilePage() {
  const supabase = createClient();
  
  const { data: profile, refetch: refetchProfile } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  
  const [coupleStatus, setCoupleStatus] = useState<any>(null);
  const [isLoadingCoupleStatus, setIsLoadingCoupleStatus] = useState(true);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inputInviteCode, setInputInviteCode] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [error, setError] = useState('');
  const [inviteMode, setInviteMode] = useState<InviteMode>('create');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    loadCoupleStatus();
  }, []);

  useEffect(() => {
    if (joinSuccess) {
      const timer = setTimeout(() => {
        loadCoupleStatus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [joinSuccess]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }
    setIsUploadingAvatar(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatarUrl);
        await refetchProfile();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '이미지 업로드에 실패했습니다.');
      }
    } catch (err) {
      setError('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const loadCoupleStatus = async () => {
    setIsLoadingCoupleStatus(true);
    try {
      const response = await fetch('/api/couple/status');
      if (response.ok) {
        const data = await response.json();
        setCoupleStatus(data);
        if (data.inviteCode) {
          setInviteCode(data.inviteCode);
        }
      }
    } catch (error) {
      console.error('커플 상태 로드 오류:', error);
    } finally {
      setIsLoadingCoupleStatus(false);
    }
  };

  const handleSave = async () => {
    setError('');
    try {
      await updateProfileMutation.mutateAsync({
        name,
        avatarUrl,
      });
      await loadCoupleStatus();
      alert('프로필이 업데이트되었습니다!');
    } catch (err) {
      setError('프로필 업데이트에 실패했습니다.');
    }
  };

  const handleGenerateInviteCode = async () => {
    setIsGenerating(true);
    setError('');
    try {
      const response = await fetch('/api/couple/create-invite', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setInviteCode(data.inviteCode);
        await loadCoupleStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '초대 코드 생성에 실패했습니다.');
      }
    } catch (error) {
      setError('초대 코드 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareInviteCode = async () => {
    const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
    const shareText = `같이봄에서 함께 재무 관리를 시작해요!\n초대 코드: ${inviteCode}\n\n또는 아래 링크를 클릭하세요:\n${inviteUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: '같이봄 커플 초대', text: shareText, url: inviteUrl });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') await handleCopyInviteCode();
      }
    } else {
      await handleCopyInviteCode();
    }
  };

  const handleCopyInviteCode = async () => {
    try {
      const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
      const shareText = `같이봄에서 함께 재무 관리를 시작해요!\n초대 코드: ${inviteCode}\n링크: ${inviteUrl}`;
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      setError('복사에 실패했습니다.');
    }
  };

  const handleJoinCouple = async () => {
    if (!inputInviteCode.trim()) {
      setError('초대 코드를 입력해주세요.');
      return;
    }
    setError('');
    setIsJoining(true);
    try {
      const response = await fetch('/api/couple/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inputInviteCode.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setJoinSuccess(true);
        setInputInviteCode('');
        await loadCoupleStatus();
        setTimeout(() => setJoinSuccess(false), 3000);
      } else {
        const errorMessages: Record<string, string> = {
          '유효하지 않은 초대 코드입니다.': '입력하신 초대 코드를 찾을 수 없습니다. 코드를 다시 확인해주세요.',
          '자신의 초대 코드는 사용할 수 없습니다.': '본인이 생성한 코드는 사용할 수 없습니다. 배우자가 생성한 코드를 입력해주세요.',
          '이미 다른 사용자와 연결된 초대 코드입니다.': '이미 사용된 초대 코드입니다. 새로운 초대 코드를 요청해주세요.',
        };
        setError(errorMessages[data.error] || data.error || '커플 연결에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  const isConnected = coupleStatus?.connected === true;
  const isPending = coupleStatus?.status === 'pending' && inviteCode && !isConnected;

  return (
    <>
      <CoupleConnectionGuide />
      
      <div className="fixed inset-0 bg-gray-50 flex flex-col overscroll-none">
        {/* Header */}
        <div 
          className="flex-none bg-white border-b border-gray-100 px-4 py-4 z-10"
          style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <div className="flex items-center justify-between max-w-lg mx-auto w-full">
            <Link href="/">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">내 프로필</h1>
            <div className="w-9"></div>
          </div>
        </div>

        {/* Content - Scrollable 영역 */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 'calc(42px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
            {/* 프로필 정보 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">프로필</h2>
              
              <div className="mb-5 flex flex-col items-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="프로필" className="w-full h-full object-cover brightness-[0.97] saturate-[0.9]" />
                    ) : (
                      <span className="text-white text-2xl font-semibold">{name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-gray-800 hover:bg-gray-900 rounded-full flex items-center justify-center shadow-md transition-all"
                  >
                    {isUploadingAvatar ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={14} className="text-white" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">닉네임</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182F6] outline-none text-gray-900"
                  placeholder="닉네임"
                  maxLength={20}
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-600 mb-1.5">이메일</label>
                <input type="email" value={profile?.email || ''} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-400" />
              </div>

              <button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending || isUploadingAvatar}
                className="w-full py-3 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-medium transition-colors"
              >
                {updateProfileMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>

            {/* 커플 연결 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">커플 연결</h2>
              
              {isLoadingCoupleStatus ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-3 border-gray-200 border-t-[#3182F6] rounded-full animate-spin"></div></div>
              ) : isConnected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {coupleStatus.partner?.avatarUrl ? <img src={coupleStatus.partner.avatarUrl} alt="파트너" className="w-full h-full object-cover brightness-[0.97] saturate-[0.9]" /> : <span className="text-white text-xl font-semibold">{coupleStatus.partner?.name?.charAt(0) || '?'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate">{coupleStatus.partner?.name || '배우자'}</p>
                        <div className="px-2 py-0.5 bg-green-50 rounded-full flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div><span className="text-xs font-medium text-green-700">연결됨</span></div>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{coupleStatus.partner?.email}</p>
                    </div>
                  </div>
                  <button className="w-full py-2 text-sm text-gray-400 hover:text-red-600 transition-colors" onClick={() => alert('연결 해제 기능은 준비 중입니다.')}>연결 해제</button>
                </div>
              ) : isPending ? (
                <div className="space-y-4">
                  <div className="text-center"><div className="flex items-center justify-center gap-2 text-amber-600 mb-2"><Clock size={16} /><span className="text-sm font-medium">대기 중</span></div><p className="text-xs text-gray-500">배우자가 아래 코드를 입력하면 연결됩니다</p></div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-2xl font-bold text-gray-900 tracking-wider font-mono text-center mb-4">{inviteCode}</p>
                    <div className="flex gap-2">
                      <button onClick={handleShareInviteCode} className="flex-1 py-3 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-medium flex items-center justify-center gap-2 text-sm"><Share2 size={16} />공유</button>
                      <button onClick={handleCopyInviteCode} className={`px-4 py-3 rounded-xl transition-colors ${copySuccess ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{copySuccess ? <Check size={16} /> : <Copy size={16} />}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex border-b border-gray-200">
                    <button onClick={() => setInviteMode('create')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${inviteMode === 'create' ? 'text-[#3182F6] border-[#3182F6]' : 'text-gray-400 border-transparent'}`}>초대하기</button>
                    <button onClick={() => setInviteMode('join')} className={`flex-1 py-3 text-sm font-medium border-b-2 ${inviteMode === 'join' ? 'text-[#3182F6] border-[#3182F6]' : 'text-gray-400 border-transparent'}`}>초대받기</button>
                  </div>
                  {inviteMode === 'create' ? (
                    <div className="pt-2">
                      {inviteCode ? (
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <p className="text-xl font-bold mb-3">{inviteCode}</p>
                          <button onClick={handleShareInviteCode} className="w-full py-3 bg-[#3182F6] text-white rounded-xl">공유하기</button>
                        </div>
                      ) : (
                        <button onClick={handleGenerateInviteCode} className="w-full py-3 bg-[#3182F6] text-white rounded-xl">초대 코드 생성</button>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 space-y-3">
                      <input type="text" value={inputInviteCode} onChange={(e) => setInputInviteCode(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-gray-50 border rounded-xl text-center text-xl font-mono text-gray-900" placeholder="ABC123" maxLength={6} />
                      <button onClick={handleJoinCouple} className="w-full py-3 bg-[#3182F6] text-white rounded-xl">연결하기</button>
                    </div>
                  )}
                </div>
              )}
              {error && <div className="mt-3 text-xs text-red-600 text-center">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
