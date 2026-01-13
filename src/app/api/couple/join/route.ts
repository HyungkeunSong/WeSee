/**
 * POST /api/couple/join
 * 
 * 초대 코드로 커플 연결
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const body = await request.json();
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: '초대 코드를 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log('[JOIN] 초대 코드 조회 시작:', inviteCode.toUpperCase());

    // 초대 코드로 커플 찾기
    const { data: couple, error: findError } = await supabase
      .from('couples')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    console.log('[JOIN] 조회 결과:', { couple, findError });

    if (findError || !couple) {
      console.error('[JOIN] 초대 코드를 찾을 수 없음:', findError);
      return NextResponse.json(
        { error: '유효하지 않은 초대 코드입니다.' },
        { status: 404 }
      );
    }

    console.log('[JOIN] 커플 찾기 성공:', couple.id);

    // 자기 자신과 연결하려는 경우
    if (couple.user1_id === user.id) {
      console.log('[JOIN] 자기 자신의 코드 사용 시도');
      return NextResponse.json(
        { error: '자신의 초대 코드는 사용할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 연결된 경우
    if (couple.status === 'connected') {
      console.log('[JOIN] 이미 연결된 코드');
      return NextResponse.json(
        { error: '이미 다른 사용자와 연결된 초대 코드입니다.' },
        { status: 400 }
      );
    }

    console.log('[JOIN] 커플 업데이트 시작');

    // 커플 연결
    const { data: updateData, error: updateError } = await supabase
      .from('couples')
      .update({
        user2_id: user.id,
        status: 'connected',
        connected_at: new Date().toISOString(),
      })
      .eq('id', couple.id)
      .select();

    console.log('[JOIN] 업데이트 결과:', { updateData, updateError });

    if (updateError) {
      console.error('[JOIN] 커플 연결 오류:', updateError);
      return NextResponse.json(
        { error: '커플 연결에 실패했습니다.', detail: updateError.message },
        { status: 500 }
      );
    }

    // 실제로 업데이트되었는지 확인
    if (!updateData || updateData.length === 0) {
      console.error('[JOIN] 업데이트된 행이 없음 (RLS 정책 문제일 수 있음)');
      return NextResponse.json(
        { error: '커플 연결 권한이 없습니다. RLS 정책을 확인해주세요.' },
        { status: 403 }
      );
    }

    console.log('[JOIN] 커플 연결 완료!', updateData[0]);

    return NextResponse.json({
      success: true,
      message: '커플 연결이 완료되었습니다!',
    });
  } catch (error) {
    console.error('커플 연결 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
