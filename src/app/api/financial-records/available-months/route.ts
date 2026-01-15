/**
 * GET /api/financial-records/available-months
 * 
 * 데이터가 있는 월 목록을 반환 (최근 24개월)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
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
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'connected')
      .single();

    if (coupleError || !coupleData) {
      return NextResponse.json(
        { error: '커플 연결이 필요합니다.' },
        { status: 403 }
      );
    }

    // 데이터가 있는 년/월 목록 조회 (최근 2년)
    const { data: records, error: recordsError } = await supabase
      .from('financial_records')
      .select('year, month')
      .eq('couple_id', coupleData.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (recordsError) {
      console.error('재무 기록 조회 오류:', recordsError);
      return NextResponse.json(
        { error: '데이터 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 중복 제거 및 "YYYY-MM" 형식으로 변환
    const availableMonths = Array.from(
      new Set(
        (records || []).map(r => `${r.year}-${String(r.month).padStart(2, '0')}`)
      )
    );

    return NextResponse.json({ availableMonths });
  } catch (error) {
    console.error('월 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
