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
      className="flex-none bg-white border-t border-gray-100 touch-none select-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(56px + env(safe-area-inset-bottom, 0px))'
      }}
    >
      <div className="flex items-center max-w-lg mx-auto px-2 h-[56px]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 active:text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium whitespace-nowrap mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
