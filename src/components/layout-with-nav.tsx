'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './bottom-nav';

export default function LayoutWithNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 네비게이션을 표시하지 않을 경로들 (로그인, 회원가입 페이지만)
  const hideNavPaths = ['/login', '/signup'];
  const shouldShowNav = !hideNavPaths.includes(pathname);

  return (
    <>
      {children}
      {shouldShowNav && <BottomNav />}
    </>
  );
}
