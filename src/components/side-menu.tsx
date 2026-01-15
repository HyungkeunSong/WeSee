'use client';

import { X, User, Info, LogOut } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  // React Query로 프로필 데이터 캐싱
  const { data: profile } = useProfile();

  const handleLogout = async () => {
    try {
      // 모든 React Query 캐시 클리어
      queryClient.clear();
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
        className={`fixed inset-0 bg-black/40 z-[100] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 사이드 메뉴 */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-64 bg-white z-[101] transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* 헤더 - 닫기 버튼만 */}
        <div className="flex items-center justify-end px-4 py-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 프로필 섹션 */}
        <Link href="/profile" onClick={onClose}>
          <div className="px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="프로필"
                    className="w-full h-full rounded-full object-cover brightness-[0.97] saturate-[0.9]"
                  />
                ) : (
                  <span className="text-white text-lg font-semibold">
                    {profile?.name?.charAt(0) || '?'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {profile?.name || '사용자'}
                </p>
                <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* 메뉴 리스트 */}
        <div 
          className="flex-1 py-2"
          style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
        >
          <Link href="/profile" onClick={onClose}>
            <div className="flex items-center gap-2 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
              <User size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">내 프로필</span>
            </div>
          </Link>

          <Link href="/app-info" onClick={onClose}>
            <div className="flex items-center gap-2 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
              <Info size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">앱 정보</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-3 w-full hover:bg-gray-50 transition-colors group"
          >
            <LogOut size={18} className="text-gray-500 group-hover:text-red-600" />
            <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">로그아웃</span>
          </button>
        </div>
      </div>
    </>
  );
}
