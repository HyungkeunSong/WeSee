'use client';

import { useState, useEffect, useRef } from 'react';
import { format, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PieChart, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

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

export default function AnalysisPage() {
  const today = new Date();
  
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [financialData, setFinancialData] = useState<FinancialRecordsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 상태를 true로
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // 재무 데이터 로드
  const loadFinancialData = async (date: Date) => {
    try {
      setIsLoading(true);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const response = await fetch(`/api/financial-records?year=${year}&month=${month}`);
      
      if (response.status === 401) {
        // 로그인이 필요한 경우
        console.log('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
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

  // 초기 로드
  useEffect(() => {
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

  // 월 선택 드롭다운 외부 클릭 감지
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

  // 지난 24개월 생성 (2년)
  const availableMonths = Array.from({ length: 24 }, (_, i) => {
    return subMonths(today, i);
  });

  // 월 변경 핸들러
  const handleMonthChange = (month: Date) => {
    setCurrentDate(month);
    setShowMonthPicker(false);
    
    // localStorage에 저장
    const year = month.getFullYear();
    const monthNumber = month.getMonth() + 1;
    localStorage.setItem('currentMonth', `${year}-${monthNumber}`);
    
    // 데이터 로드
    loadFinancialData(month);
  };

  // 카테고리 데이터를 금액 순으로 정렬하고 상위 5개만 표시
  const getCategoryList = () => {
    if (!financialData) return [];
    
    return Object.entries(financialData.combinedData.categoryAnalysis)
      .filter(([_, data]) => data.amount > 0)
      .sort(([_, a], [__, b]) => b.amount - a.amount)
      .slice(0, 10);
  };

  const categoryList = getCategoryList();
  const summary = financialData?.combinedData.summary;

  // 포맷 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 초기 로드 시에만 데이터 없음 화면 표시
  if (!financialData && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        <div className="max-w-lg mx-auto">
          {/* Header - safe-area까지 흰색 배경 확장 */}
          <div 
            className="bg-white border-b border-gray-100 px-4 py-4"
            style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
          >
            <h1 className="text-3xl font-bold text-gray-900">
              소비 분석
            </h1>
          </div>

          {/* 월 선택 */}
          <div className="p-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div ref={monthPickerRef} className="relative">
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className={`w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors ${
                    showMonthPicker 
                      ? 'rounded-t-xl' 
                      : 'rounded-xl'
                  }`}
                >
                  <span className="font-semibold text-gray-900">
                    {format(currentDate, 'yyyy년 M월', { locale: ko })}
                  </span>
                  <ChevronDown
                    className={`text-gray-500 transition-transform ${
                      showMonthPicker ? 'rotate-180' : ''
                    }`}
                    size={20}
                  />
                </button>

                {/* 월 선택 드롭다운 */}
                {showMonthPicker && (
                  <div className="absolute left-0 right-0 top-[calc(100%-2px)] bg-white border-2 border-t border-gray-200 rounded-b-xl shadow-lg max-h-60 overflow-y-auto z-50">
                    {availableMonths.map((month) => (
                      <button
                        key={month.toISOString()}
                        onClick={() => handleMonthChange(month)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          format(month, 'yyyy-MM') === format(currentDate, 'yyyy-MM')
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {format(month, 'yyyy년 M월', { locale: ko })}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 데이터 없음 */}
          <div className="p-8 text-center">
            <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">아직 데이터가 없습니다</p>
            <p className="text-sm text-gray-400">
              업로드 탭에서 토스 화면을 업로드해주세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-lg mx-auto">
        {/* Header - safe-area까지 흰색 배경 확장 */}
        <div 
          className="bg-white border-b border-gray-100 px-4 py-4"
          style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <h1 className="text-3xl font-bold text-gray-900">
            소비 분석
          </h1>
        </div>

        {/* 월 선택 */}
        <div className="p-4 pb-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div ref={monthPickerRef} className="relative">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors ${
                  showMonthPicker 
                    ? 'rounded-t-xl' 
                    : 'rounded-xl'
                }`}
              >
                <span className="font-semibold text-gray-900">
                  {format(currentDate, 'yyyy년 M월', { locale: ko })}
                </span>
                <ChevronDown
                  className={`text-gray-500 transition-transform ${
                    showMonthPicker ? 'rotate-180' : ''
                  }`}
                  size={20}
                />
              </button>

              {/* 월 선택 드롭다운 */}
              {showMonthPicker && (
                <div className="absolute left-0 right-0 top-[calc(100%-2px)] bg-white border-2 border-t border-gray-200 rounded-b-xl shadow-lg max-h-60 overflow-y-auto z-50">
                  {availableMonths.map((month) => (
                    <button
                      key={month.toISOString()}
                      onClick={() => handleMonthChange(month)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        format(month, 'yyyy-MM') === format(currentDate, 'yyyy-MM')
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-700'
                      }`}
                    >
                      {format(month, 'yyyy년 M월', { locale: ko })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="p-4 space-y-3">
          {/* 총 지출 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">이번 달 총 지출</p>
                <p className={`text-3xl font-bold text-gray-900 transition-opacity duration-300 ${
                  isLoading ? 'opacity-30' : 'opacity-100'
                }`}>
                  {formatCurrency(summary?.totalExpense || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <TrendingDown className="text-red-500" size={24} />
              </div>
            </div>
          </div>

          {/* 총 수입 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">이번 달 총 수입</p>
                <p className={`text-3xl font-bold text-gray-900 transition-opacity duration-300 ${
                  isLoading ? 'opacity-30' : 'opacity-100'
                }`}>
                  {formatCurrency(summary?.totalIncome || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <TrendingUp className="text-blue-500" size={24} />
              </div>
            </div>
          </div>

          {/* 순수입 */}
          <div className={`bg-white rounded-2xl p-5 shadow-sm border ${
            (summary?.netIncome || 0) >= 0 ? 'border-blue-100 bg-blue-50/30' : 'border-red-100 bg-red-50/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">순수입</p>
                <p className={`text-2xl font-bold transition-opacity duration-300 ${
                  (summary?.netIncome || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                } ${isLoading ? 'opacity-30' : 'opacity-100'}`}>
                  {(summary?.netIncome || 0) >= 0 ? '+' : ''}
                  {formatCurrency(summary?.netIncome || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 카테고리별 소비 */}
        <div className="p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">카테고리별 소비</h2>
            </div>

            {categoryList.length === 0 ? (
              <div className={`p-8 text-center text-gray-400 transition-opacity duration-300 ${
                isLoading ? 'opacity-30' : 'opacity-100'
              }`}>
                소비 데이터가 없습니다
              </div>
            ) : (
              <div className={`divide-y divide-gray-100 transition-opacity duration-300 ${
                isLoading ? 'opacity-30' : 'opacity-100'
              }`}>
                {categoryList.map(([category, data], index) => (
                  <div
                    key={category}
                    className="px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{category}</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(data.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${data.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-500 w-12 text-right">
                        {data.percentage.toFixed(1)}%
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
  );
}
