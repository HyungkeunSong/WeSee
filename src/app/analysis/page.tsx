'use client';

import { useState, useEffect, useRef } from 'react';
import { format, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TrendingUp, TrendingDown, ChevronDown, Loader2, X, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CategoryData {
  amount: number;
  percentage: number;
}

interface FinancialRecordsResponse {
  combinedData: {
    summary: {
      totalIncome: number;
      totalExpense: number;
      netIncome: number;
    };
    categoryAnalysis: Record<string, CategoryData>;
  };
  year: number;
  month: number;
}

// 개별 값 로딩을 위한 작은 스피너 컴포넌트
const InlineLoader = () => (
  <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
);

export default function AnalysisPage() {
  const today = new Date();
  const router = useRouter();
  
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [financialData, setFinancialData] = useState<FinancialRecordsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<Set<string>>(new Set());
  const [showBanner, setShowBanner] = useState(true);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  
  // 데이터 없는 상태 확인
  const hasNoData = !financialData && !isLoading;

  // 재무 데이터 로드
  const loadFinancialData = async (date: Date) => {
    try {
      setIsLoading(true);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const response = await fetch(`/api/financial-records?year=${year}&month=${month}`);
      
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
      } else {
        setFinancialData(null);
      }
    } catch (error) {
      console.error('재무 데이터 로드 오류:', error);
      setFinancialData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 데이터가 있는 월 목록 로드
  const loadAvailableMonths = async () => {
    try {
      const response = await fetch('/api/financial-records/available-months');
      
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setAvailableMonths(new Set(data.availableMonths));
      }
    } catch (error) {
      console.error('데이터가 있는 월 목록 로드 오류:', error);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadAvailableMonths();
    
    const savedMonth = localStorage.getItem('currentMonth');
    if (savedMonth) {
      const [year, month] = savedMonth.split('-').map(Number);
      const savedDate = new Date(year, month - 1, 1);
      setCurrentDate(savedDate);
      loadFinancialData(savedDate);
    } else {
      loadFinancialData(today);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
    };
    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthPicker]);

  const monthsList = Array.from({ length: 24 }, (_, i) => subMonths(today, i));

  const handleMonthChange = (month: Date) => {
    const monthKey = format(month, 'yyyy-MM');
    
    // 데이터가 없는 월은 선택 불가
    if (!availableMonths.has(monthKey)) {
      return;
    }
    
    setCurrentDate(month);
    setShowMonthPicker(false);
    const year = month.getFullYear();
    const monthNumber = month.getMonth() + 1;
    localStorage.setItem('currentMonth', `${year}-${monthNumber}`);
    loadFinancialData(month);
  };
  
  const hasData = (month: Date) => {
    const monthKey = format(month, 'yyyy-MM');
    return availableMonths.has(monthKey);
  };

  const getCategoryList = () => {
    if (!financialData) return [];
    return Object.entries(financialData.combinedData.categoryAnalysis)
      .filter(([_, data]) => data.amount > 0)
      .sort(([_, a], [__, b]) => b.amount - a.amount)
      .slice(0, 10);
  };

  const categoryList = getCategoryList();
  const summary = financialData?.combinedData.summary;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 공통 헤더 컴포넌트
  const Header = () => (
    <div className="flex-none bg-white border-b border-gray-100 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="h-[90px] max-w-[490px] mx-auto px-4 flex flex-col justify-end pb-4">
        <h1 className="text-3xl font-bold text-gray-900">소비 분석</h1>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white flex flex-col overscroll-none">
      <Header />

      <div className="flex-1 overflow-y-auto bg-gray-50 overscroll-contain relative" style={{ paddingBottom: 'calc(44px + min(env(safe-area-inset-bottom, 0px), 20px))' }}>
        <div className="max-w-lg mx-auto w-full">
          
          {/* 월 선택 */}
          <div className="p-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div ref={monthPickerRef} className="relative">
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors ${
                    showMonthPicker ? 'rounded-t-xl' : 'rounded-xl'
                  }`}
                >
                  <span className="font-semibold text-gray-900">
                    {format(currentDate, 'yyyy년 M월', { locale: ko })}
                  </span>
                  <ChevronDown className={`text-gray-500 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} size={20} />
                </button>

                {showMonthPicker && (
                  <div className="absolute left-0 right-0 top-[calc(100%-2px)] bg-white border-2 border-t border-gray-200 rounded-b-xl shadow-lg max-h-60 overflow-y-auto z-[60]">
                    {monthsList.map((month) => {
                      const isCurrentMonth = format(month, 'yyyy-MM') === format(currentDate, 'yyyy-MM');
                      const hasMonthData = hasData(month);
                      
                      return (
                        <button
                          key={month.toISOString()}
                          onClick={() => handleMonthChange(month)}
                          disabled={!hasMonthData}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            !hasMonthData
                              ? 'text-gray-300 cursor-not-allowed'
                              : isCurrentMonth
                              ? 'bg-[#EBF4FF] text-[#3182F6] font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {format(month, 'yyyy년 M월', { locale: ko })}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 데이터 없을 때 안내 배너 */}
          {hasNoData && showBanner && (
            <div className="px-4 pb-4">
              <div className="bg-[#EBF4FF] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3182F6] rounded-full flex items-center justify-center flex-shrink-0">
                  <Upload size={18} className="text-white" />
                </div>
                <p className="text-base text-gray-700 flex-1">
                  토스 화면을 올려보세요!
                </p>
                <button
                  onClick={() => router.push('/upload')}
                  className="text-base font-semibold text-[#3182F6] hover:text-[#1C6DD0] whitespace-nowrap"
                >
                  업로드
                </button>
                <button
                  onClick={() => setShowBanner(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* 요약 카드 */}
          <div className="p-4 pt-0 space-y-3">
            {/* 총 지출 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">이번 달 총 지출</p>
                  <div className="h-9 flex items-center">
                    {isLoading ? (
                      <InlineLoader />
                    ) : (
                      <p className={`text-3xl font-bold ${hasNoData ? 'text-gray-300' : 'text-gray-900'}`}>
                        {formatCurrency(summary?.totalExpense || 0)}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasNoData ? 'bg-gray-100' : 'bg-red-50'}`}>
                  <TrendingDown className={hasNoData ? 'text-gray-300' : 'text-red-500'} size={24} />
                </div>
              </div>
            </div>

            {/* 총 수입 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">이번 달 총 수입</p>
                  <div className="h-9 flex items-center">
                    {isLoading ? (
                      <InlineLoader />
                    ) : (
                      <p className={`text-3xl font-bold ${hasNoData ? 'text-gray-300' : 'text-gray-900'}`}>
                        {formatCurrency(summary?.totalIncome || 0)}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasNoData ? 'bg-gray-100' : 'bg-blue-50'}`}>
                  <TrendingUp className={hasNoData ? 'text-gray-300' : 'text-blue-500'} size={24} />
                </div>
              </div>
            </div>

            {/* 순수입 */}
            <div className={`bg-white rounded-2xl p-5 shadow-sm border ${
              hasNoData 
                ? 'border-gray-100' 
                : (summary?.netIncome || 0) >= 0 
                  ? 'border-blue-100 bg-blue-50/30' 
                  : 'border-red-100 bg-red-50/30'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">순수입</p>
                  <div className="h-9 flex items-center">
                    {isLoading ? (
                      <InlineLoader />
                    ) : (
                      <p className={`text-3xl font-bold ${
                        hasNoData 
                          ? 'text-gray-300' 
                          : (summary?.netIncome || 0) >= 0 
                            ? 'text-blue-600' 
                            : 'text-red-600'
                      }`}>
                        {formatCurrency(summary?.netIncome || 0)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 카테고리별 소비 */}
          <div className="p-4 pt-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">카테고리별 소비</h2>
              </div>

              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <InlineLoader />
                  <p className="text-sm text-gray-400">분석 데이터를 불러오는 중...</p>
                </div>
              ) : categoryList.length === 0 ? (
                <div className="p-6">
                  {/* 샘플 카테고리 표시 (0원) */}
                  <div className="space-y-4">
                    {['식비', '교통', '쇼핑', '생활'].map((category) => (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-300">{category}</span>
                          <span className="text-lg font-bold text-gray-300">0원</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-200 rounded-full" style={{ width: '0%' }} />
                          </div>
                          <span className="text-sm font-medium text-gray-300 w-12 text-right">0%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {categoryList.map(([category, data]) => (
                    <div key={category} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{category}</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(data.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#3182F6] rounded-full transition-all duration-500"
                            style={{ width: `${data.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-500 w-12 text-right">
                          {data.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
