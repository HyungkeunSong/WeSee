/**
 * POST /api/couple/create-invite
 * 
 * 초대 코드 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[1/5] 초대 코드 생성 시작');
    const supabase = await createClient();

    // 인증 확인
    console.log('[2/5] 사용자 인증 확인 중...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[2/5] 인증 실패:', authError);
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    console.log('[2/5] 사용자 인증 성공:', user.id);

    // 이미 커플이 있는지 확인
    console.log('[3/5] 기존 커플 존재 여부 확인 중...');
    const { data: existingCouple, error: checkError } = await supabase
      .from('couples')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[3/5] 커플 조회 오류:', checkError);
    }

    if (existingCouple) {
      console.log('[3/5] 기존 커플 발견, 초대 코드 반환:', existingCouple.invite_code);
      // 이미 커플이 있으면 해당 초대코드 반환
      return NextResponse.json({
        success: true,
        inviteCode: existingCouple.invite_code,
        status: existingCouple.status,
      });
    }
    console.log('[3/5] 기존 커플 없음, 새로 생성 필요');

    // 새 초대 코드 생성
    console.log('[4/5] RPC 함수로 초대 코드 생성 중...');
    const { data: inviteCodeData, error: inviteError } = await supabase
      .rpc('generate_invite_code');

    if (inviteError) {
      console.error('[4/5] RPC 초대 코드 생성 오류:', inviteError);
      return NextResponse.json(
        { error: `초대 코드 생성 실패: ${inviteError.message}`, detail: inviteError },
        { status: 500 }
      );
    }

    const inviteCode = inviteCodeData;
    console.log('[4/5] 초대 코드 생성 성공:', inviteCode);

    // couples 테이블에 삽입
    console.log('[5/5] couples 테이블에 삽입 중...');
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .insert({
        user1_id: user.id,
        invite_code: inviteCode,
        status: 'pending',
      })
      .select()
      .single();

    if (coupleError) {
      console.error('[5/5] 커플 생성 오류:', coupleError);
      return NextResponse.json(
        { error: `커플 생성 실패: ${coupleError.message}`, detail: coupleError },
        { status: 500 }
      );
    }

    console.log('[5/5] 커플 생성 완료:', coupleData);

    return NextResponse.json({
      success: true,
      inviteCode: coupleData.invite_code,
      status: coupleData.status,
    });
  } catch (error) {
    console.error('[ERROR] 초대 코드 생성 중 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
}
