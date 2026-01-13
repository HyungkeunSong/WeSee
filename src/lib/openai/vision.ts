/**
 * GPT Vision API 호출 함수
 */

import { openai } from './client';
import { GPT_CONFIG } from '@/lib/prompts';
import type { CalendarImageResult, AnalysisImageResult } from '@/types/financial';

/**
 * GPT Vision API를 사용하여 이미지를 분석
 */
async function analyzeImageWithGPT(
  imageUrl: string,
  prompt: string
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      ...GPT_CONFIG,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('GPT 응답이 비어있습니다.');
    }

    // JSON 파싱
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('GPT 응답에서 JSON을 찾을 수 없습니다.');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('GPT Vision API 오류:', error);
    throw new Error(`이미지 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * 캘린더 이미지 분석
 */
export async function analyzeCalendarImage(
  imageUrl: string,
  prompt: string
): Promise<CalendarImageResult> {
  const result = await analyzeImageWithGPT(imageUrl, prompt);
  
  console.log('[CALENDAR] GPT 응답:', JSON.stringify(result, null, 2));
  
  // 데이터 검증 (year는 null이어도 괜찮음 - fallback 사용)
  if (!result.month || !result.dailyTransactions || !result.summary) {
    console.error('[CALENDAR] 검증 실패 - year:', result.year, 'month:', result.month, 'dailyTransactions:', !!result.dailyTransactions, 'summary:', !!result.summary);
    throw new Error('캘린더 이미지 분석 결과가 올바르지 않습니다.');
  }

  return result as CalendarImageResult;
}

/**
 * 소비분석 이미지 분석
 */
export async function analyzeAnalysisImage(
  imageUrl: string,
  prompt: string
): Promise<AnalysisImageResult> {
  const result = await analyzeImageWithGPT(imageUrl, prompt);
  
  console.log('[ANALYSIS] GPT 응답:', JSON.stringify(result, null, 2));
  
  // 데이터 검증 (year는 null이어도 괜찮음 - fallback 사용)
  if (!result.month || !result.categoryAnalysis) {
    console.error('[ANALYSIS] 검증 실패 - year:', result.year, 'month:', result.month, 'categoryAnalysis:', !!result.categoryAnalysis);
    throw new Error('소비분석 이미지 분석 결과가 올바르지 않습니다.');
  }

  return result as AnalysisImageResult;
}

/**
 * 여러 이미지를 분석하고 병합
 */
export async function analyzeMultipleImages(
  images: Array<{ url: string; type: 'calendar' | 'analysis' }>,
  calendarPrompt: string,
  analysisPrompt: string,
  fallbackYear?: number,
  fallbackMonth?: number
): Promise<{
  year: number;
  month: number;
  calendarData?: CalendarImageResult;
  analysisData?: AnalysisImageResult;
}> {
  const results = await Promise.all(
    images.map(async (image) => {
      if (image.type === 'calendar') {
        const data = await analyzeCalendarImage(image.url, calendarPrompt);
        return { type: 'calendar' as const, data };
      } else {
        const data = await analyzeAnalysisImage(image.url, analysisPrompt);
        return { type: 'analysis' as const, data };
      }
    })
  );

  // 결과 병합
  const calendarResult = results.find(r => r.type === 'calendar');
  const analysisResult = results.find(r => r.type === 'analysis');

  // GPT가 읽은 연도/월 또는 사용자가 선택한 연도/월 사용
  const year = calendarResult?.data.year || analysisResult?.data.year || fallbackYear;
  const month = calendarResult?.data.month || analysisResult?.data.month || fallbackMonth;

  if (!year || !month) {
    throw new Error('이미지에서 연도와 월을 읽을 수 없습니다.');
  }

  console.log('[MERGE] 최종 year/month:', { year, month, fromGPT: { calYear: calendarResult?.data.year, calMonth: calendarResult?.data.month, anaYear: analysisResult?.data.year, anaMonth: analysisResult?.data.month }, fallback: { fallbackYear, fallbackMonth } });

  return {
    year,
    month,
    calendarData: calendarResult?.data as CalendarImageResult,
    analysisData: analysisResult?.data as AnalysisImageResult,
  };
}
