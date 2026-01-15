'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './bottom-nav';

export default function LayoutWithNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 네비게이션을 표시하지 않을 경로들
  const hideNavPaths = ['/login', '/signup', '/invite'];
  const hideNavPrefixes = ['/test']; // 테스트 페이지들
  const shouldShowNav = !hideNavPaths.includes(pathname) && 
    !hideNavPrefixes.some(prefix => pathname.startsWith(prefix));

  // GNB가 필요한 페이지: 전체를 하나의 fixed 컨테이너로 감싸서 GNB 움직임 방지
  if (shouldShowNav) {
    return (
      <div className="fixed inset-0 flex flex-col bg-white overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          {children}
        </div>
        <BottomNav />
      </div>
    );
  }

  return <>{children}</>;
}
