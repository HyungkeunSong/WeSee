import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, subMonths } from 'date-fns';
import { useEffect } from 'react';

interface DayData {
  income: number;
  expense: number;
}

export interface FinancialRecordsResponse {
  combinedData: {
    summary: {
      totalIncome: number;
      totalExpense: number;
      netIncome: number;
    };
    dailyTransactions: Record<string, DayData>;
    categoryAnalysis: Record<string, { amount: number; percentage: number }>;
  };
  individuals: Record<string, {
    userName?: string;
    avatarUrl?: string;
    data: {
      dailyTransactions: Record<string, DayData>;
    };
  }>;
  year: number;
  month: number;
}

async function fetchFinancialData(year: number, month: number): Promise<FinancialRecordsResponse | null> {
  // 캐시 방지를 위해 timestamp 추가
  const timestamp = Date.now();
  const response = await fetch(`/api/financial-records?year=${year}&month=${month}&_t=${timestamp}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
  
  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
}

export function useFinancialData(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['financial-records', year, month],
    queryFn: () => fetchFinancialData(year, month),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });

  // Prefetch 이전 달과 다음 달
  useEffect(() => {
    if (query.data) {
      // 이전 달 prefetch
      const prevMonth = subMonths(date, 1);
      const prevYear = prevMonth.getFullYear();
      const prevMonthNum = prevMonth.getMonth() + 1;
      
      queryClient.prefetchQuery({
        queryKey: ['financial-records', prevYear, prevMonthNum],
        queryFn: () => fetchFinancialData(prevYear, prevMonthNum),
        staleTime: 5 * 60 * 1000,
      });

      // 다음 달 prefetch
      const nextMonth = addMonths(date, 1);
      const nextYear = nextMonth.getFullYear();
      const nextMonthNum = nextMonth.getMonth() + 1;
      
      queryClient.prefetchQuery({
        queryKey: ['financial-records', nextYear, nextMonthNum],
        queryFn: () => fetchFinancialData(nextYear, nextMonthNum),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [query.data, date, queryClient]);

  return query;
}
