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
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div 
          className="flex items-center max-w-lg mx-auto"
          style={{
            height: 'calc(3.5rem + env(safe-area-inset-bottom))',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-14 transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium whitespace-nowrap mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
