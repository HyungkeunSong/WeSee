'use client';

import { X, User, Info, LogOut } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  
  // React Query로 프로필 데이터 캐싱
  const { data: profile } = useProfile();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 사이드 메뉴 */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">메뉴</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* 프로필 섹션 */}
        <Link href="/profile" onClick={onClose}>
          <div className="px-6 py-6 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="프로필"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {profile?.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-lg truncate">
                  {profile?.name || '사용자'}
                </p>
                <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* 메뉴 리스트 */}
        <div className="py-4">
          <Link href="/profile" onClick={onClose}>
            <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">내 프로필</p>
                <p className="text-xs text-gray-500">프로필 및 초대 코드 관리</p>
              </div>
            </div>
          </Link>

          <Link href="/app-info" onClick={onClose}>
            <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Info size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">앱 정보</p>
                <p className="text-xs text-gray-500">버전 및 라이선스 정보</p>
              </div>
            </div>
          </Link>
        </div>

        {/* 로그아웃 버튼 */}
        <div 
          className="absolute left-0 right-0 p-6 border-t border-gray-100 bg-white"
          style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium transition-colors"
          >
            <LogOut size={20} />
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
