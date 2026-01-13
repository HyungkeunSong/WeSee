/**
 * 부부 재무 데이터 합산 로직
 */

import type {
  FinancialData,
  CombinedFinancialData,
  DailyTransactionsMap,
  CategoryAnalysisMap,
  MonthlySummary,
} from '@/types/financial';

/**
 * 두 사용자의 일별 거래 데이터를 합산
 */
export function mergeDailyTransactions(
  data1: DailyTransactionsMap,
  data2: DailyTransactionsMap
): DailyTransactionsMap {
  const merged: DailyTransactionsMap = {};
  const allDays = new Set([...Object.keys(data1), ...Object.keys(data2)]);

  for (const day of allDays) {
    merged[day] = {
      income: (data1[day]?.income || 0) + (data2[day]?.income || 0),
      expense: (data1[day]?.expense || 0) + (data2[day]?.expense || 0),
    };
  }

  return merged;
}

/**
 * 두 사용자의 카테고리 분석 데이터를 합산
 */
export function mergeCategoryAnalysis(
  data1: CategoryAnalysisMap,
  data2: CategoryAnalysisMap
): CategoryAnalysisMap {
  const merged: CategoryAnalysisMap = {};
  const allCategories = new Set([
    ...Object.keys(data1),
    ...Object.keys(data2),
  ]);

  // 총 금액 계산
  let totalAmount = 0;
  for (const category of allCategories) {
    const amount1 = data1[category]?.amount || 0;
    const amount2 = data2[category]?.amount || 0;
    const mergedAmount = amount1 + amount2;
    
    merged[category] = {
      amount: mergedAmount,
      percentage: 0, // 나중에 계산
    };
    
    totalAmount += mergedAmount;
  }

  // 퍼센트 재계산
  if (totalAmount > 0) {
    for (const category of allCategories) {
      merged[category].percentage = 
        Math.round((merged[category].amount / totalAmount) * 1000) / 10;
    }
  }

  return merged;
}

/**
 * 두 사용자의 월간 요약 데이터를 합산
 */
export function mergeSummary(
  summary1: MonthlySummary,
  summary2: MonthlySummary
): MonthlySummary {
  return {
    totalIncome: summary1.totalIncome + summary2.totalIncome,
    totalExpense: summary1.totalExpense + summary2.totalExpense,
    netIncome: summary1.netIncome + summary2.netIncome,
  };
}

/**
 * 부부의 전체 재무 데이터를 합산
 */
export function mergeCoupleData(
  user1Data: FinancialData | null,
  user2Data: FinancialData | null
): CombinedFinancialData {
  // 둘 다 없는 경우 빈 데이터 반환
  if (!user1Data && !user2Data) {
    return {
      summary: {
        totalIncome: 0,
        totalExpense: 0,
        netIncome: 0,
      },
      dailyTransactions: {},
      categoryAnalysis: {},
    };
  }

  // 한 명만 있는 경우 그 사람 데이터만 반환
  if (!user1Data) {
    return {
      summary: user2Data!.summary,
      dailyTransactions: user2Data!.dailyTransactions,
      categoryAnalysis: user2Data!.categoryAnalysis,
    };
  }

  if (!user2Data) {
    return {
      summary: user1Data.summary,
      dailyTransactions: user1Data.dailyTransactions,
      categoryAnalysis: user1Data.categoryAnalysis,
    };
  }

  // 둘 다 있는 경우 합산
  return {
    summary: mergeSummary(user1Data.summary, user2Data.summary),
    dailyTransactions: mergeDailyTransactions(
      user1Data.dailyTransactions,
      user2Data.dailyTransactions
    ),
    categoryAnalysis: mergeCategoryAnalysis(
      user1Data.categoryAnalysis,
      user2Data.categoryAnalysis
    ),
  };
}
