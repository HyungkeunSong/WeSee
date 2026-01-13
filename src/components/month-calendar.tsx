"use client";

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, isSameWeek } from "date-fns";
import { ko } from "date-fns/locale";

interface DayData {
  income: number;
  expense: number;
}

interface MonthCalendarProps {
  currentDate: Date;
  data: Record<string, DayData>;
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
  viewMode?: 'month' | 'week';
}

export function MonthCalendar({
  currentDate,
  data,
  selectedDate,
  onDateClick,
  viewMode = 'month',
}: MonthCalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  // 날짜들을 주별로 그룹화
  const getWeeks = () => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    // 첫 주의 빈 칸 추가 (일요일 시작 기준)
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null as any); // placeholder for empty slots
    }
    
    days.forEach((day, index) => {
      currentWeek.push(day);
      
      // 토요일이거나 마지막 날이면 주 완성
      if (getDay(day) === 6 || index === days.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    return weeks;
  };

  const weeks = getWeeks();
  
  // 선택된 날짜가 포함된 주의 인덱스 찾기
  const getSelectedWeekIndex = () => {
    if (!selectedDate) return 0;
    return weeks.findIndex(week => 
      week.some(day => day && isSameWeek(day, selectedDate, { weekStartsOn: 0 }))
    );
  };
  
  const selectedWeekIndex = getSelectedWeekIndex();
  
  // 각 주의 높이 (px)
  const weekHeight = 72;

  return (
    <div 
      className="px-4 transition-all duration-300 ease-out"
      style={{
        // 주간 뷰: 요일 헤더 + 1줄, 월간 뷰: 요일 헤더 + 모든 줄
        height: viewMode === 'week' 
          ? `${40 + weekHeight + 16}px`  // 헤더 + 1주 + 패딩
          : `${40 + weeks.length * weekHeight + 16}px`, // 헤더 + 모든 주 + 패딩
        overflow: 'hidden',
      }}
    >
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-2">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div
            key={day}
            className="text-center py-2 text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 - 주별로 렌더링 */}
      <div 
        className="transition-transform duration-300 ease-out"
        style={{
          // 주간 뷰일 때 선택된 주가 맨 위로 오도록 이동
          transform: viewMode === 'week' 
            ? `translateY(-${selectedWeekIndex * weekHeight}px)` 
            : 'translateY(0)',
        }}
      >
        {weeks.map((week, weekIndex) => {
          // 주간 뷰에서 선택된 주가 아닌 경우의 스타일
          const isSelectedWeek = weekIndex === selectedWeekIndex;
          const isBeforeSelected = weekIndex < selectedWeekIndex;
          const isAfterSelected = weekIndex > selectedWeekIndex;
          
          return (
            <div 
              key={weekIndex}
              className="grid grid-cols-7 transition-all duration-300 ease-out"
              style={{
                height: `${weekHeight}px`,
                opacity: viewMode === 'week' && !isSelectedWeek ? 0 : 1,
                // 선택된 주 위/아래 주들의 추가 효과
                transform: viewMode === 'week' 
                  ? isBeforeSelected 
                    ? 'scale(0.95)' 
                    : isAfterSelected 
                      ? 'scale(0.95)' 
                      : 'scale(1)'
                  : 'scale(1)',
              }}
            >
              {week.map((day, dayIndex) => {
                // 빈 칸 처리
                if (!day) {
                  return <div key={`empty-${weekIndex}-${dayIndex}`} />;
                }
                
                const dateKey = format(day, "yyyy-MM-dd");
                const dayData = data[dateKey];
                const hasData = dayData && (dayData.income !== 0 || dayData.expense !== 0);
                const selected = selectedDate && format(selectedDate, "yyyy-MM-dd") === dateKey;
                const today = new Date();
                const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDateClick(day)}
                    className={`
                      relative flex flex-col items-center py-2 rounded-2xl transition-all duration-200
                      ${selected ? "bg-white" : "hover:bg-gray-50"}
                    `}
                    style={selected ? {
                      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                      transform: 'scale(1.02)',
                    } : undefined}
                  >
                    {/* 날짜 숫자 */}
                    <span
                      className={`
                        text-base font-medium mb-1
                        ${isToday ? "text-toss-blue font-bold" : hasData ? "text-gray-900" : "text-gray-400"}
                      `}
                    >
                      {format(day, "d")}
                    </span>

                    {/* 수입/지출 표시 */}
                    {hasData && (
                      <div className="flex flex-col items-center text-[9px] space-y-0.5 min-h-[32px]">
                        {dayData.income > 0 && (
                          <span className="text-toss-blue font-normal">
                            +{dayData.income.toLocaleString()}
                          </span>
                        )}
                        {dayData.expense > 0 && (
                          <span className={`font-normal ${dayData.expense >= 100000 ? "text-toss-red" : "text-gray-500"}`}>
                            -{dayData.expense.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
