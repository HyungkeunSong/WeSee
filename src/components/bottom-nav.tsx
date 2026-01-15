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
      className="flex-none bg-white border-t border-gray-200 touch-none select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center max-w-[430px] mx-auto h-[50px]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-[#3182F6]'
                  : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[11px] font-medium mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
