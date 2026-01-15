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

  // GNB가 있는 페이지는 전체 레이아웃을 fixed로 감싸서 iOS rubber-band 방지
  if (shouldShowNav) {
    return (
      <div 
        className="fixed inset-0 flex flex-col"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
        <BottomNav />
      </div>
    );
  }

  return <>{children}</>;
}
