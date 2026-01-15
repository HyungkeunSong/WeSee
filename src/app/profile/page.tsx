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
  
  // React Query로 프로필 데이터 캐싱
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

  // 프로필 데이터가 로드되면 폼 상태 업데이트
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    loadCoupleStatus();
  }, []);

  // 커플 연결 성공 시 상태 다시 로드하여 상대방 정보 업데이트
  useEffect(() => {
    if (joinSuccess) {
      // 연결 성공 후 약간의 딜레이를 주고 상태 다시 로드
      const timer = setTimeout(() => {
        loadCoupleStatus();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [joinSuccess]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 체크
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
        // 프로필 캐시 갱신
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
        console.log('커플 상태 로드됨:', data);
        setCoupleStatus(data);
        if (data.inviteCode) {
          setInviteCode(data.inviteCode);
        }
      } else {
        console.error('커플 상태 로드 실패:', response.status);
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
      // 프로필 업데이트 후 커플 상태도 다시 로드 (상대방이 내 프로필을 볼 수 있도록)
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
      console.error('초대 코드 생성 오류:', error);
      setError('초대 코드 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareInviteCode = async () => {
    const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
    const shareText = `같이봄에서 함께 재무 관리를 시작해요!\n초대 코드: ${inviteCode}\n\n또는 아래 링크를 클릭하세요:\n${inviteUrl}`;

    // Web Share API 지원 확인
    if (navigator.share) {
      try {
        await navigator.share({
          title: '같이봄 커플 초대',
          text: shareText,
          url: inviteUrl,
        });
      } catch (error) {
        // 사용자가 공유 취소한 경우 무시
        if ((error as Error).name !== 'AbortError') {
          console.error('공유 오류:', error);
          // 폴백: 클립보드 복사
          await handleCopyInviteCode();
        }
      }
    } else {
      // Web Share API 미지원 시 클립보드 복사
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
      console.error('복사 오류:', error);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: inputInviteCode.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setJoinSuccess(true);
        setInputInviteCode('');
        await loadCoupleStatus();
        setTimeout(() => setJoinSuccess(false), 3000);
      } else {
        // 개선된 에러 메시지
        const errorMessages: Record<string, string> = {
          '유효하지 않은 초대 코드입니다.': '입력하신 초대 코드를 찾을 수 없습니다. 코드를 다시 확인해주세요.',
          '자신의 초대 코드는 사용할 수 없습니다.': '본인이 생성한 코드는 사용할 수 없습니다. 배우자가 생성한 코드를 입력해주세요.',
          '이미 다른 사용자와 연결된 초대 코드입니다.': '이미 사용된 초대 코드입니다. 새로운 초대 코드를 요청해주세요.',
        };
        
        setError(errorMessages[data.error] || data.error || '커플 연결에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    } finally {
      setIsJoining(false);
    }
  };

  // 커플이 연결되어 있는지 확인
  const isConnected = coupleStatus?.connected === true;
  
  // 대기 중인 상태인지 확인 (내가 생성한 코드로 상대방 대기 중)
  const isPending = coupleStatus?.status === 'pending' && inviteCode && !isConnected;

  // 디버깅: 커플 상태 변경 시 로그
  useEffect(() => {
    if (coupleStatus) {
      console.log('=== 커플 상태 업데이트 ===');
      console.log('Connected:', isConnected);
      console.log('Partner:', coupleStatus.partner);
      console.log('Partner Name:', coupleStatus.partner?.name);
      console.log('Partner Avatar:', coupleStatus.partner?.avatarUrl);
    }
  }, [coupleStatus, isConnected]);

  return (
    <>
      {/* 온보딩 가이드 */}
      <CoupleConnectionGuide />
      
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div 
        className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          <Link href="/">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">내 프로필</h1>
          <div className="w-9"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5 space-y-4">
          {/* 프로필 정보 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">프로필</h2>
            
            {/* 프로필 사진 */}
            <div className="mb-5 flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="프로필"
                      className="w-full h-full rounded-full object-cover brightness-[0.97] saturate-[0.9]"
                    />
                  ) : (
                    <span className="text-white text-2xl font-semibold">
                      {name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                
                {/* 카메라 버튼 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-gray-800 hover:bg-gray-900 rounded-full flex items-center justify-center shadow-md transition-all disabled:bg-gray-400"
                >
                  {isUploadingAvatar ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={14} className="text-white" />
                  )}
                </button>
                
                {/* 숨겨진 파일 입력 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* 닉네임 */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                닉네임
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent text-gray-900"
                placeholder="이름을 입력하세요"
                maxLength={20}
              />
            </div>

            {/* 이메일 (읽기 전용) */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                이메일
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-400"
              />
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending || isUploadingAvatar}
              className={`w-full py-3 rounded-xl font-medium transition-colors ${
                updateProfileMutation.isPending || isUploadingAvatar
                  ? 'bg-[#93C5FD] text-white cursor-not-allowed'
                  : 'bg-[#3182F6] hover:bg-[#1C6DD0] text-white'
              }`}
            >
              {updateProfileMutation.isPending ? '저장 중...' : isUploadingAvatar ? '업로드 중...' : '저장'}
            </button>
          </div>

          {/* 커플 연결 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">커플 연결</h2>
            
            {isLoadingCoupleStatus ? (
              /* 로딩 중 */
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-3 border-gray-200 border-t-[#3182F6] rounded-full animate-spin"></div>
              </div>
            ) : isConnected ? (
              /* 연결됨 */
              <div className="space-y-3">
                {/* 배우자 정보 */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {coupleStatus.partner?.avatarUrl ? (
                      <img
                        src={coupleStatus.partner.avatarUrl}
                        alt={coupleStatus.partner.name}
                        className="w-full h-full rounded-full object-cover brightness-[0.97] saturate-[0.9]"
                      />
                    ) : (
                      <span className="text-white text-xl font-semibold">
                        {coupleStatus.partner?.name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {coupleStatus.partner?.name || '배우자'}
                      </p>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-medium text-green-700">연결됨</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate mb-1">
                      {coupleStatus.partner?.email}
                    </p>
                    {coupleStatus.connectedAt && (
                      <p className="text-xs text-gray-400">
                        {new Date(coupleStatus.connectedAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })} 연결
                      </p>
                    )}
                  </div>
                </div>

                {/* 연결 관리 */}
                <button
                  className="w-full py-2 text-sm text-gray-400 hover:text-red-600 transition-colors"
                  onClick={() => {
                    if (confirm('정말 연결을 해제하시겠습니까?\n공유된 재무 데이터를 더 이상 볼 수 없습니다.')) {
                      alert('연결 해제 기능은 곧 추가됩니다.');
                    }
                  }}
                >
                  연결 해제
                </button>
              </div>
            ) : isPending ? (
              /* 대기 상태 */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-600 mb-2">
                    <Clock size={16} />
                    <span className="text-sm font-medium">대기 중</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    배우자가 아래 코드를 입력하면 연결됩니다
                  </p>
                </div>

                {/* 초대 코드 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2 text-center">초대 코드</p>
                  <p className="text-2xl font-bold text-gray-900 tracking-wider font-mono text-center mb-4">
                    {inviteCode}
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleShareInviteCode}
                      className="flex-1 py-3 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Share2 size={16} />
                      공유
                    </button>
                    <button
                      onClick={handleCopyInviteCode}
                      className={`px-4 py-3 rounded-xl font-medium transition-colors text-sm ${
                        copySuccess
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* 연결 안됨 - 탭 UI */
              <div className="space-y-4">
                {/* 탭 선택 */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => {
                      setInviteMode('create');
                      setError('');
                    }}
                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      inviteMode === 'create'
                        ? 'text-[#3182F6] border-[#3182F6]'
                        : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                  >
                    초대하기
                  </button>
                  <button
                    onClick={() => {
                      setInviteMode('join');
                      setError('');
                    }}
                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      inviteMode === 'join'
                        ? 'text-[#3182F6] border-[#3182F6]'
                        : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                  >
                    초대받기
                  </button>
                </div>

                {/* 탭 컨텐츠 */}
                {inviteMode === 'create' ? (
                  /* 초대하기 탭 */
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-gray-600 text-center">
                      초대 코드를 생성하고 배우자에게 공유하세요
                    </p>

                    {inviteCode ? (
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-xs text-gray-500 mb-2 text-center">초대 코드</p>
                          <p className="text-xl font-bold text-gray-900 tracking-wider font-mono text-center mb-3">
                            {inviteCode}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleShareInviteCode}
                              className="flex-1 py-3 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <Share2 size={16} />
                              공유
                            </button>
                            <button
                              onClick={handleCopyInviteCode}
                              className={`px-4 py-3 rounded-xl font-medium transition-colors text-sm ${
                                copySuccess
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateInviteCode}
                        disabled={isGenerating}
                        className="w-full py-3 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-[#93C5FD] disabled:cursor-not-allowed"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            <UserPlus size={16} />
                            초대 코드 생성
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  /* 초대받기 탭 */
                  <div className="space-y-3 pt-2">
                    <p className="text-sm text-gray-600 text-center">
                      배우자에게 받은 6자리 코드를 입력하세요
                    </p>

                    <input
                      type="text"
                      value={inputInviteCode}
                      onChange={(e) => setInputInviteCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3182F6] focus:border-transparent font-mono text-xl text-center uppercase tracking-widest font-semibold text-gray-900"
                      placeholder="ABC123"
                      maxLength={6}
                    />
                    
                    <button
                      onClick={handleJoinCouple}
                      disabled={isJoining || !inputInviteCode.trim()}
                      className="w-full py-3 bg-[#3182F6] hover:bg-[#1C6DD0] text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-[#93C5FD] disabled:cursor-not-allowed"
                    >
                      {isJoining ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          연결 중...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          연결하기
                        </>
                      )}
                    </button>

                    {/* 성공 메시지 */}
                    {joinSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-sm text-green-700 font-medium">
                          커플 연결이 완료되었습니다!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-600 text-center">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
