"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format, addMonths, subMonths, addWeeks, subWeeks, isSameMonth, endOfMonth, isAfter, isBefore, subYears } from "date-fns";
import { ko } from "date-fns/locale";
import { useSwipeable } from "react-swipeable";
import { Menu, ChevronDown, ChevronUp } from "lucide-react";
import { MonthCalendar } from "@/components/month-calendar";
import { SideMenu } from "@/components/side-menu";
import { CoupleInviteSheet } from "@/components/couple-invite-sheet";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useProfile } from "@/hooks/useProfile";

// 날짜별 수입/지출 데이터 타입
interface DayData {
  income: number;
  expense: number;
}

// 개인별 거래 내역 타입
interface PersonTransaction {
  person: string;
  avatarUrl?: string;
  amount: number;
  type: "income" | "expense";
}

// API 응답 타입은 hook에서 import
import type { FinancialRecordsResponse } from "@/hooks/useFinancialData";

export default function Home() {
  const today = new Date();
  
  // 초기값은 항상 today로 설정 (SSR/CSR 일치)
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preferredDay, setPreferredDay] = useState<number>(today.getDate()); // 사용자가 선호하는 일자
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const [isCoupleConnected, setIsCoupleConnected] = useState<boolean | null>(null);
  
  // 캘린더 뷰 모드: 'month' | 'week'
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week'>('month');
  
  // 디테일뷰 ref (스와이프 감지용)
  const detailRef = useRef<HTMLDivElement>(null);

  // React Query로 재무 데이터 로드 (캐싱 + prefetching 자동 처리)
  const { data: financialData, isLoading } = useFinancialData(currentDate);
  
  // 프로필 데이터 미리 로드 (사이드 메뉴에서 즉시 표시하기 위함)
  useProfile();

  // 클라이언트에서 마운트 후 localStorage에서 월 복원
  useEffect(() => {
    const hasSeenInviteSheet = localStorage.getItem('hasSeenInviteSheet');
    const savedMonth = localStorage.getItem('currentMonth');
    
    // 첫 방문(바텀시트 안 본 상태)이면 현재 월로 설정
    if (!hasSeenInviteSheet) {
      // 첫 방문이므로 현재 월 사용 (today는 이미 오늘 날짜)
      setIsInitialized(true);
      return;
    }
    
    // 재방문이면 저장된 월 복원
    if (savedMonth) {
      const [year, month] = savedMonth.split('-').map(Number);
      const savedDate = new Date(year, month - 1, 1);
      setCurrentDate(savedDate);
    }
    setIsInitialized(true);
  }, []);

  // 커플 연결 상태 확인 및 바텀 시트 표시
  useEffect(() => {
    const checkCoupleStatus = async () => {
      try {
        const response = await fetch('/api/couple/status');
        if (response.ok) {
          const data = await response.json();
          setIsCoupleConnected(data.connected);
          
          // 커플 미연결 + 처음 방문(또는 회원가입 직후)인 경우 바텀 시트 표시
          if (!data.connected) {
            const hasSeenInviteSheet = localStorage.getItem('hasSeenInviteSheet');
            if (!hasSeenInviteSheet) {
              // 약간의 딜레이 후 표시 (페이지 로드 후 자연스럽게)
              setTimeout(() => {
                setIsInviteSheetOpen(true);
                localStorage.setItem('hasSeenInviteSheet', 'true');
              }, 1000);
            }
          }
        }
      } catch {
        // 에러 시 무시 (로그인 안된 상태 등)
      }
    };

    if (isInitialized) {
      checkCoupleStatus();
    }
  }, [isInitialized]);

  // 선택 날짜 초기화 로직
  useEffect(() => {
    // 현재 월의 마지막 날짜 확인
    const lastDayOfMonth = endOfMonth(currentDate).getDate();
    
    // preferredDay가 현재 월에 존재하면 그 날을, 없으면 마지막 날을 선택
    const dayToSelect = preferredDay <= lastDayOfMonth ? preferredDay : lastDayOfMonth;
    
    // 새로운 날짜 생성
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayToSelect);
    setSelectedDate(newDate);
  }, [currentDate, preferredDay]);

  // 현재 보고 있는 월을 localStorage에 저장
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('currentMonth', format(currentDate, 'yyyy-MM'));
    }
  }, [currentDate, isInitialized]);

  // 월 이동 가능 여부 확인
  const twoYearsAgo = subYears(today, 2);
  const canGoPrevious = isAfter(subMonths(currentDate, 1), twoYearsAgo);
  const canGoNext = isBefore(addMonths(currentDate, 1), today);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setPreferredDay(date.getDate()); // 선택한 일자를 기억
  };

  const handlePreviousMonth = () => {
    if (canGoPrevious && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentDate(subMonths(currentDate, 1));
        setIsTransitioning(false);
      }, 150);
    }
  };

  const handleNextMonth = () => {
    if (canGoNext && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentDate(addMonths(currentDate, 1));
        setIsTransitioning(false);
      }, 150);
    }
  };
  
  // 주 단위 이동 핸들러 (주간 뷰에서 사용)
  const handleNextWeek = () => {
    if (!selectedDate) return;
    const nextWeek = addWeeks(selectedDate, 1);
    
    // 미래 제한 체크 (오늘 이후로는 이동 불가)
    if (isAfter(nextWeek, today)) return;
    
    setSelectedDate(nextWeek);
    setPreferredDay(nextWeek.getDate());
    
    // 달이 바뀌면 currentDate도 변경
    if (!isSameMonth(nextWeek, currentDate)) {
      setCurrentDate(nextWeek);
    }
  };

  const handlePreviousWeek = () => {
    if (!selectedDate) return;
    const prevWeek = subWeeks(selectedDate, 1);
    
    // 2년 전 제한 체크
    if (isBefore(prevWeek, twoYearsAgo)) return;
    
    setSelectedDate(prevWeek);
    setPreferredDay(prevWeek.getDate());
    
    // 달이 바뀌면 currentDate도 변경
    if (!isSameMonth(prevWeek, currentDate)) {
      setCurrentDate(prevWeek);
    }
  };
  
  // 뷰 모드 토글
  const toggleViewMode = () => {
    setCalendarViewMode(prev => prev === 'month' ? 'week' : 'month');
  };

  // 캘린더 영역 스와이프 핸들러 - 좌우로 월/주 이동
  const calendarSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (calendarViewMode === 'week') {
        handleNextWeek();
      } else {
        handleNextMonth();
      }
    },
    onSwipedRight: () => {
      if (calendarViewMode === 'week') {
        handlePreviousWeek();
      } else {
        handlePreviousMonth();
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 50,
  });
  
  // 디테일뷰 ref
  const combinedDetailRef = useCallback((el: HTMLDivElement | null) => {
    detailRef.current = el;
  }, []);
  

  // 선택된 날짜의 상세 데이터 가져오기
  const getSelectedDayData = () => {
    if (!selectedDate || !financialData) return null;
    
    const day = selectedDate.getDate();
    const dayKey = day.toString();
    const dayData = financialData.combinedData.dailyTransactions[dayKey];

    if (!dayData) return null;

    // 개인별 데이터 분해
    const breakdown: PersonTransaction[] = [];
    Object.entries(financialData.individuals || {}).forEach(([userId, userData]) => {
      const personDayData = userData.data.dailyTransactions[dayKey];
      if (personDayData) {
        const userName = userData.userName || '사용자';
        const avatarUrl = userData.avatarUrl;
        if (personDayData.income > 0) {
          breakdown.push({
            person: userName,
            avatarUrl: avatarUrl,
            amount: personDayData.income,
            type: 'income',
          });
        }
        if (personDayData.expense > 0) {
          breakdown.push({
            person: userName,
            avatarUrl: avatarUrl,
            amount: personDayData.expense,
            type: 'expense',
          });
        }
      }
    });

    // 정렬: 수입 먼저, 지출 나중에, 같은 타입 내에서는 닉네임 가나다순
    breakdown.sort((a, b) => {
      // 1. 타입별 정렬 (income이 expense보다 먼저)
      if (a.type !== b.type) {
        return a.type === 'income' ? -1 : 1;
      }
      // 2. 같은 타입 내에서는 닉네임 가나다순
      return a.person.localeCompare(b.person, 'ko-KR');
    });

    return {
      date: selectedDate,
      total: dayData,
      breakdown,
    };
  };

  const selectedDayData = getSelectedDayData();

  // 월간 데이터를 날짜별 Map으로 변환 (캘린더 컴포넌트용)
  const getDayDataMap = (): Record<string, DayData> => {
    if (!financialData) return {};
    
    const result: Record<string, DayData> = {};
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    Object.entries(financialData.combinedData.dailyTransactions).forEach(([day, data]) => {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      result[dateKey] = data;
    });
    
    return result;
  };

  return (
    <div className="absolute inset-0 bg-white flex flex-col overflow-hidden">
      {/* Header + Calendar Area - flex-none으로 상단 고정 */}
      <div className="flex-none bg-white z-30 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Header */}
        <div className="bg-white px-4 py-4">
          {/* 년도 표시 */}
          <div className="text-sm text-gray-500 font-medium mb-1">
            {format(currentDate, "yyyy년", { locale: ko })}
          </div>
          {/* 월 표시 + 오늘 버튼 + 설정 아이콘 */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {format(currentDate, "M월", { locale: ko })}
            </h1>
            <div className="flex items-center gap-4">
              {/* 오늘 버튼 */}
              <button
                onClick={() => {
                  const isViewingToday = selectedDate && format(selectedDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                  if (!isTransitioning && !isViewingToday) {
                    if (isSameMonth(currentDate, today)) {
                      setSelectedDate(today);
                      setPreferredDay(today.getDate());
                    } else {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentDate(today);
                        setPreferredDay(today.getDate());
                        setIsTransitioning(false);
                      }, 150);
                    }
                  }
                }}
                disabled={selectedDate ? format(selectedDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd") : false}
                className={`text-sm font-semibold transition-colors ${
                  selectedDate && format(selectedDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-900 hover:text-gray-600"
                }`}
              >
                오늘
              </button>
              <button 
                onClick={() => setIsSideMenuOpen(true)}
                className="p-2.5 hover:bg-gray-50 rounded-lg transition-all active:scale-95"
              >
                <Menu size={24} className="text-gray-400" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* 캘린더 영역 */}
        <div 
          {...calendarSwipeHandlers}
          className="flex-none border-t border-gray-100"
          style={{ touchAction: 'pan-x' }}
        >
          <MonthCalendar
            currentDate={currentDate}
            data={getDayDataMap()}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            viewMode={calendarViewMode}
            isTransitioning={isTransitioning}
          />
        </div>
        
        {/* 뷰 모드 전환 버튼 */}
        <button
          onClick={toggleViewMode}
          className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-gray-600 transition-colors active:bg-gray-50 focus:outline-none border-b border-gray-100"
        >
          {calendarViewMode === 'month' ? (
            <ChevronUp size={20} />
          ) : (
            <ChevronDown size={20} />
          )}
        </button>
      </div>

      {/* 상세 내역 영역 */}
      <div 
        ref={combinedDetailRef}
        className="flex-1 bg-white overflow-y-auto overscroll-contain"
      >
        {selectedDayData && selectedDayData.breakdown.length > 0 ? (
          <div className="px-4 pt-4 pb-4">
            {/* 날짜 헤더 */}
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {format(selectedDayData.date, "M월 d일 EEEE", { locale: ko })}
            </h3>

            {/* 거래 목록 - 카드형 */}
            <div className="space-y-3">
              {selectedDayData.breakdown.map((transaction, index) => {
                // 이니셜 추출 (첫 글자)
                const initial = transaction.person.charAt(0);
                // 수입/지출에 따른 아바타 배경색 (토스 색상)
                const avatarBg = transaction.type === "income" 
                  ? "bg-toss-blue-light" 
                  : "bg-toss-red-light";
                const avatarText = transaction.type === "income"
                  ? "text-toss-blue-dark"
                  : "text-toss-red-dark";
                
                return (
                  <div 
                    key={index} 
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
                  >
                    {/* 아바타 */}
                    <div className={`w-10 h-10 rounded-full ${avatarBg} ${avatarText} flex items-center justify-center font-semibold text-sm flex-shrink-0 overflow-hidden`}>
                      {transaction.avatarUrl ? (
                        <img
                          src={transaction.avatarUrl}
                          alt={transaction.person}
                          className="w-full h-full object-cover brightness-[0.97] saturate-[0.9]"
                        />
                      ) : (
                        initial
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 flex items-center justify-between">
                      {/* 왼쪽: 이름 + 타입 */}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.person}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {transaction.type === "income" ? "수입" : "지출"}
                        </div>
                      </div>

                      {/* 오른쪽: 금액 */}
                      <div
                        className={`text-lg font-medium ${
                          transaction.type === "income" ? "text-toss-blue" : "text-toss-red"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {transaction.amount.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 py-12">
            <p>{selectedDate ? format(selectedDate, "M월 d일", { locale: ko }) + "에는 내역이 없어요" : "날짜를 선택해주세요"}</p>
          </div>
        )}
      </div>

      {/* 사이드 메뉴 */}
      <SideMenu isOpen={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} />

      {/* 커플 초대 바텀 시트 */}
      <CoupleInviteSheet
        isOpen={isInviteSheetOpen}
        onClose={() => setIsInviteSheetOpen(false)}
        onSuccess={() => {
          setIsCoupleConnected(true);
          // 성공 시 재무 데이터 새로고침
          window.location.reload();
        }}
      />
    </div>
  );
}
