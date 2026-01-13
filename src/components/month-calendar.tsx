"use client";

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";

interface DayData {
  income: number;
  expense: number;
}

interface MonthCalendarProps {
  currentDate: Date;
  data: Record<string, DayData>;
  selectedDate: Date | null;
  onDateClick: (date: Date) => void;
}

export function MonthCalendar({
  currentDate,
  data,
  selectedDate,
  onDateClick,
}: MonthCalendarProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  return (
    <div className="px-4 py-4">
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

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-y-2">
        {/* 빈 셀 (월 시작 전) */}
        {Array.from({ length: startDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {/* 날짜 버튼 */}
      {days.map((day) => {
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
