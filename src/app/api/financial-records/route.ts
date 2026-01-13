/**
 * GET /api/financial-records?year=2025&month=12
 * 
 * 부부의 재무 데이터를 조회하고 합산하여 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { mergeCoupleData } from '@/lib/financial/merge';
import type { FinancialRecordsResponse, IndividualDataMap } from '@/types/financial';

export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || '');
    const month = parseInt(searchParams.get('month') || '');

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json(
        { error: '올바른 연도와 월을 입력해주세요.' },
        { status: 400 }
      );
    }

    // couple_id 조회
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id, user1_id, user2_id')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'connected')
      .single();

    if (coupleError || !coupleData) {
      return NextResponse.json(
        { error: '커플 연결이 필요합니다.' },
        { status: 403 }
      );
    }

    // 부부의 재무 기록 조회
    const { data: records, error: recordsError } = await supabase
      .from('financial_records')
      .select('*')
      .eq('couple_id', coupleData.id)
      .eq('year', year)
      .eq('month', month);

    if (recordsError) {
      console.error('재무 기록 조회 오류:', recordsError);
      return NextResponse.json(
        { error: '데이터 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 부부 두 명의 프로필 조회 (Service Role로 RLS 우회)
    const userIds = [coupleData.user1_id, coupleData.user2_id];
    const supabaseAdmin = createServiceRoleClient();
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('프로필 조회 오류:', profilesError);
    }

    // 프로필 맵 생성
    const profileMap: Record<string, { name: string; avatarUrl?: string }> = {};
    if (profiles) {
      profiles.forEach(profile => {
        profileMap[profile.id] = {
          name: profile.name || '사용자',
          avatarUrl: profile.avatar_url || undefined,
        };
      });
    }

    // 개인별 데이터 맵 생성
    const individuals: IndividualDataMap = {};
    const dataArray = [];

    for (const record of records || []) {
      const profile = profileMap[record.user_id];
      individuals[record.user_id] = {
        userName: profile?.name || '사용자',
        avatarUrl: profile?.avatarUrl,
        data: record.data,
      };
      dataArray.push(record.data);
    }

    // 부부 데이터 합산
    const combinedData = mergeCoupleData(
      dataArray[0] || null,
      dataArray[1] || null
    );

    const response: FinancialRecordsResponse = {
      combinedData,
      individuals,
      year,
      month,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('재무 기록 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
