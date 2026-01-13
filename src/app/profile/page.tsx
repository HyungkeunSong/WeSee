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
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">내 프로필</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 space-y-6 pb-6">
          {/* 프로필 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">프로필 정보</h2>
            
            {/* 프로필 사진 */}
            <div className="mb-6 flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="프로필"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-3xl font-bold">
                      {name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                
                {/* 카메라 버튼 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg transition-all disabled:bg-gray-400"
                >
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={16} className="text-white" />
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
              
              <p className="text-xs text-gray-500 mt-3">
                이미지를 클릭하여 프로필 사진 변경
              </p>
            </div>

            {/* 닉네임 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이름을 입력하세요"
                maxLength={20}
              />
            </div>

            {/* 이메일 (읽기 전용) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500"
              />
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending || isUploadingAvatar}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                updateProfileMutation.isPending || isUploadingAvatar
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {updateProfileMutation.isPending ? '저장 중...' : isUploadingAvatar ? '이미지 업로드 중...' : '닉네임 저장'}
            </button>
          </div>

          {/* 커플 연결 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">커플 연결</h2>
            
            {isConnected ? (
              /* 연결됨 - 개선안 1: 상대방 중심 */
              <div className="space-y-3">
                {/* 배우자 정보 카드 (핵심 정보) */}
                <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100 relative">
                  {/* 작은 연결 배지 (오른쪽 상단) */}
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span className="font-medium">연결됨</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pr-12">
                    {/* 배우자 프로필 사진 */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      {coupleStatus.partner?.avatarUrl ? (
                        <img
                          src={coupleStatus.partner.avatarUrl}
                          alt={coupleStatus.partner.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-2xl font-bold">
                          {coupleStatus.partner?.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>

                    {/* 배우자 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-gray-900 truncate mb-0.5">
                        {coupleStatus.partner?.name || '배우자'}
                      </p>
                      <p className="text-xs text-gray-600 truncate mb-1">
                        {coupleStatus.partner?.email}
                      </p>
                      {/* 연결 날짜 */}
                      {coupleStatus.connectedAt && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <svg className="w-3 h-3 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span>
                            {new Date(coupleStatus.connectedAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} 연결
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 연결 관리 */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 text-center py-2">
                    연결 관리
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-600 mb-2">
                      ⚠️ 연결을 해제하면 공유된 재무 데이터를 더 이상 볼 수 없습니다.
                    </p>
                    <button
                      className="w-full py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                      onClick={() => {
                        if (confirm('정말 연결을 해제하시겠습니까?')) {
                          // TODO: 연결 해제 API 구현
                          alert('연결 해제 기능은 곧 추가됩니다.');
                        }
                      }}
                    >
                      연결 해제
                    </button>
                  </div>
                </details>
              </div>
            ) : isPending ? (
              /* 대기 상태 - 간결한 디자인 */
              <div className="space-y-3">
                <div className="text-center py-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-3">
                    <Clock size={32} className="text-amber-600 animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    배우자의 연결을 기다리는 중...
                  </h3>
                  <p className="text-xs text-gray-600 mb-3">
                    아래 초대 코드를 배우자에게 공유하세요
                  </p>

                  {/* 초대 코드 표시 */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200 mb-3">
                    <p className="text-xs text-gray-600 mb-1">초대 코드</p>
                    <p className="text-2xl font-bold text-blue-600 tracking-wider font-mono mb-3">
                      {inviteCode}
                    </p>
                    
                    {/* 공유 버튼들 */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleShareInviteCode}
                        className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        <Share2 size={18} />
                        공유하기
                      </button>
                      <button
                        onClick={handleCopyInviteCode}
                        className={`px-3 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-1 text-sm ${
                          copySuccess
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      💡 배우자가 코드를 입력하면 자동으로 연결됩니다
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* 연결 안됨 - 탭 UI */
              <div className="space-y-4">
                {/* 탭 선택 */}
                <div className="bg-gray-100 rounded-xl p-1 grid grid-cols-2 gap-1">
                  <button
                    onClick={() => {
                      setInviteMode('create');
                      setError('');
                    }}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      inviteMode === 'create'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    초대하기
                  </button>
                  <button
                    onClick={() => {
                      setInviteMode('join');
                      setError('');
                    }}
                    className={`py-3 rounded-lg font-semibold transition-all ${
                      inviteMode === 'join'
                        ? 'bg-white text-purple-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    초대받기
                  </button>
                </div>

                {/* 탭 컨텐츠 */}
                {inviteMode === 'create' ? (
                  /* 초대하기 탭 - 간결한 버전 */
                  <div className="space-y-3">
                    <div className="text-center py-2">
                      <div className="text-3xl mb-2">💌</div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">
                        배우자를 초대하세요
                      </h3>
                      <p className="text-xs text-gray-600">
                        초대 코드를 생성하고 배우자에게 공유하세요
                      </p>
                    </div>

                    {inviteCode ? (
                      <div className="space-y-2">
                        {/* 초대 코드 표시 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                          <p className="text-xs text-gray-600 mb-1 text-center">초대 코드</p>
                          <p className="text-xl font-bold text-blue-600 tracking-wider font-mono text-center mb-2">
                            {inviteCode}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleShareInviteCode}
                              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                            >
                              <Share2 size={16} />
                              공유하기
                            </button>
                            <button
                              onClick={handleCopyInviteCode}
                              className={`px-3 py-2.5 rounded-lg font-semibold transition-all text-sm ${
                                copySuccess
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                          <p className="text-xs text-amber-800 text-center">
                            ⏰ 배우자가 이 코드를 입력하면 자동으로 연결됩니다
                          </p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateInviteCode}
                        disabled={isGenerating}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            <UserPlus size={18} />
                            초대 코드 생성하기
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  /* 초대받기 탭 - 간결한 버전 */
                  <div className="space-y-3">
                    <div className="text-center py-2">
                      <div className="text-3xl mb-2">💝</div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">
                        초대 코드를 입력하세요
                      </h3>
                      <p className="text-xs text-gray-600">
                        배우자에게 받은 6자리 코드를 입력하세요
                      </p>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={inputInviteCode}
                        onChange={(e) => setInputInviteCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-xl text-center uppercase tracking-widest font-bold"
                        placeholder="ABC123"
                        maxLength={6}
                      />
                      
                      <button
                        onClick={handleJoinCouple}
                        disabled={isJoining || !inputInviteCode.trim()}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isJoining ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            연결 중...
                          </>
                        ) : (
                          <>
                            <Send size={18} />
                            커플 연결하기
                          </>
                        )}
                      </button>
                    </div>

                    {/* 성공 메시지 */}
                    {joinSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center animate-in slide-in-from-top">
                        <p className="text-sm text-green-700 font-semibold">
                          🎉 커플 연결이 완료되었습니다!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 animate-in slide-in-from-top">
                <p className="text-xs text-red-600 text-center">
                  ⚠️ {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
