/**
 * POST /api/process-images
 * 
 * GPT Vision API로 이미지 분석 후 financial_records에 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeMultipleImages } from '@/lib/openai/vision';
import { CALENDAR_IMAGE_PROMPT, ANALYSIS_IMAGE_PROMPT } from '@/lib/prompts';
import type { FinancialData } from '@/types/financial';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // couple_id 조회
    console.log('[PROCESS] 커플 조회 시작 - user.id:', user.id);
    
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id, status, user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'connected')
      .single();

    console.log('[PROCESS] 커플 조회 결과:', { coupleData, coupleError });

    if (coupleError || !coupleData) {
      console.error('[PROCESS] 커플을 찾을 수 없음:', coupleError);
      return NextResponse.json(
        { error: '커플 연결이 필요합니다.' },
        { status: 403 }
      );
    }

    console.log('[PROCESS] 커플 연결 확인 완료:', coupleData.id);

    // 요청 데이터
    const body = await request.json();
    const { images, year, month } = body as {
      images: Array<{ url: string; type: 'calendar' | 'analysis' }>;
      year: number;
      month: number;
    };

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: '이미지가 없습니다.' },
        { status: 400 }
      );
    }

    // GPT Vision API로 이미지 분석 (사용자가 선택한 year/month를 fallback으로 전달)
    const analysisResult = await analyzeMultipleImages(
      images,
      CALENDAR_IMAGE_PROMPT,
      ANALYSIS_IMAGE_PROMPT,
      year,  // fallback year
      month  // fallback month
    );

    // FinancialData 구조 생성
    const financialData: FinancialData = {
      summary: analysisResult.calendarData?.summary || {
        totalIncome: 0,
        totalExpense: analysisResult.analysisData?.totalExpense || 0,
        netIncome: 0,
      },
      dailyTransactions: analysisResult.calendarData?.dailyTransactions || {},
      categoryAnalysis: analysisResult.analysisData?.categoryAnalysis || {},
      uploadedAt: new Date().toISOString(),
      recognitionMethod: 'gpt-vision',
    };

    // 이미지 URL 배열
    const imageUrls = images.map(img => img.url);

    // financial_records에 UPSERT
    const { data: recordData, error: recordError } = await supabase
      .from('financial_records')
      .upsert(
        {
          user_id: user.id,
          couple_id: coupleData.id,
          year: analysisResult.year,
          month: analysisResult.month,
          data: financialData,
          image_urls: imageUrls,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,year,month',
        }
      )
      .select()
      .single();

    if (recordError) {
      console.error('DB 저장 오류:', recordError);
      return NextResponse.json(
        { error: '데이터 저장에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: financialData,
      recordId: recordData.id,
      year: analysisResult.year,
      month: analysisResult.month,
    });
  } catch (error) {
    console.error('이미지 처리 오류:', error);
    return NextResponse.json(
      { 
        error: '이미지 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
