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

  return (
    <>
      {children}
      {shouldShowNav && <BottomNav />}
    </>
  );
}
