"use client";

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek, isSameWeek } from "date-fns";
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

  // 선택된 날짜가 포함된 주의 시작/끝 날짜 계산
  const getWeekDays = () => {
    if (!selectedDate) return days;
    
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // 일요일 시작
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
    
    // 해당 주에 포함된 현재 월의 날짜들만 필터링
    return days.filter(day => {
      return day >= weekStart && day <= weekEnd;
    });
  };

  // 주간 뷰일 때 보여줄 날짜들
  const weekDays = getWeekDays();
  
  // 주간 뷰에서 시작 요일의 빈 칸 계산
  const getWeekStartOffset = () => {
    if (!selectedDate || weekDays.length === 0) return 0;
    return getDay(weekDays[0]);
  };

  const displayDays = viewMode === 'week' ? weekDays : days;
  const emptySlots = viewMode === 'week' ? getWeekStartOffset() : startDayOfWeek;

  // 전체 행 수 계산 (애니메이션용)
  const totalRows = viewMode === 'week' ? 1 : Math.ceil((startDayOfWeek + days.length) / 7);

  return (
    <div 
      className="px-4 transition-all duration-300 ease-out"
      style={{
        // 주간 뷰: 요일 헤더 + 1줄, 월간 뷰: 요일 헤더 + N줄
        maxHeight: viewMode === 'week' ? '130px' : '400px',
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

      {/* 캘린더 그리드 - 선택 효과가 잘리지 않도록 패딩 추가 */}
      <div className="grid grid-cols-7 gap-y-2 pb-6 -mx-1 px-1">
        {/* 빈 셀 (월/주 시작 전) */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {/* 날짜 버튼 */}
        {displayDays.map((day) => {
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
                relative flex flex-col items-center py-2 rounded-2xl transition-all
                ${selected ? "bg-white scale-105" : "hover:bg-gray-50"}
              `}
              style={selected ? {
                boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.08)'
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
    </div>
  );
}
