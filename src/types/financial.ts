/**
 * 재무 데이터 타입 정의
 */

// 일별 거래 데이터
export interface DailyTransaction {
  income: number;
  expense: number;
  transactions?: Array<{
    amount: number;
    type: 'income' | 'expense';
    memo?: string;
  }>;
}

// 일별 거래 맵 (날짜 -> 거래 데이터)
export interface DailyTransactionsMap {
  [day: string]: DailyTransaction;
}

// 카테고리 분석 데이터
export interface CategoryData {
  amount: number;
  percentage: number;
}

// 카테고리 분석 맵
export interface CategoryAnalysisMap {
  [category: string]: CategoryData;
}

// 월간 요약 데이터
export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
}

// 재무 기록 데이터 (JSONB에 저장될 구조)
export interface FinancialData {
  summary: MonthlySummary;
  dailyTransactions: DailyTransactionsMap;
  categoryAnalysis: CategoryAnalysisMap;
  uploadedAt: string;
  recognitionMethod: string;
}

// DB financial_records 테이블 구조
export interface FinancialRecord {
  id: string;
  user_id: string;
  couple_id: string;
  year: number;
  month: number;
  data: FinancialData;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

// GPT 캘린더 이미지 분석 결과
export interface CalendarImageResult {
  year: number;
  month: number;
  dailyTransactions: DailyTransactionsMap;
  summary: MonthlySummary;
}

// GPT 소비분석 이미지 분석 결과
export interface AnalysisImageResult {
  year: number;
  month: number;
  totalExpense: number;
  categoryAnalysis: CategoryAnalysisMap;
}

// 부부 합산 데이터
export interface CombinedFinancialData {
  summary: MonthlySummary;
  dailyTransactions: DailyTransactionsMap;
  categoryAnalysis: CategoryAnalysisMap;
}

// 개인별 데이터 맵
export interface IndividualDataMap {
  [userId: string]: {
    userName?: string;
    avatarUrl?: string;
    data: FinancialData;
  };
}

// API 응답: 부부 합산 조회
export interface FinancialRecordsResponse {
  combinedData: CombinedFinancialData;
  individuals: IndividualDataMap;
  year: number;
  month: number;
}
