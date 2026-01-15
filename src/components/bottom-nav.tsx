'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarHeart, Upload, PieChart } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: '홈',
      href: '/',
      icon: CalendarHeart,
    },
    {
      name: '업로드',
      href: '/upload',
      icon: Upload,
    },
    {
      name: '소비분석',
      href: '/analysis',
      icon: PieChart,
    },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 touch-none select-none"
    >
      {/* GNB 콘텐츠 영역 - 초슬림 디자인 (42px) */}
      <div className="bg-white/70 backdrop-blur-lg border-t border-gray-100/50">
        <div className="flex items-center max-w-lg mx-auto h-[42px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                  isActive
                    ? 'text-[#3182F6]'
                    : 'text-gray-400 active:scale-90'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[8.5px] font-bold mt-0.5 tracking-tighter">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe area spacer - 투명도 최적화 */}
      <div 
        className="bg-white/70 backdrop-blur-lg"
        style={{ height: 'env(safe-area-inset-bottom, 0px)' }} 
      />
    </nav>
  );
}
