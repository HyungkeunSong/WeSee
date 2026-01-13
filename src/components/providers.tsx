"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
        gcTime: 10 * 60 * 1000, // 10분간 메모리에 보관
        refetchOnWindowFocus: false, // 창 포커스 시 자동 refetch 비활성화
        retry: 1, // 실패 시 1번만 재시도
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
