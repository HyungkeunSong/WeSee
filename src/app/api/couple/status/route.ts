/**
 * GET /api/couple/status
 * 
 * 커플 연결 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

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

    // 커플 정보 조회
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({
        connected: false,
        inviteCode: null,
        partner: null,
      });
    }

    // 파트너 ID 결정
    const isUser1 = couple.user1_id === user.id;
    const partnerId = isUser1 ? couple.user2_id : couple.user1_id;

    // 파트너 프로필 조회 (Service Role 사용하여 RLS 우회)
    let partner = null;
    if (partnerId) {
      try {
        const serviceSupabase = createServiceRoleClient();
        const { data: partnerProfile, error: partnerError } = await serviceSupabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .eq('id', partnerId)
          .single();
        
        if (partnerError) {
          console.error('파트너 프로필 조회 오류:', partnerError);
        } else {
          console.log('파트너 프로필 조회 성공:', partnerProfile);
          partner = partnerProfile;
        }
      } catch (serviceError) {
        console.error('Service Role 클라이언트 생성 오류:', serviceError);
        // Service Role이 설정되지 않은 경우 일반 클라이언트로 재시도
        const { data: partnerProfile, error: partnerError } = await supabase
          .from('profiles')
          .select('id, name, email, avatar_url')
          .eq('id', partnerId)
          .single();
        
        if (!partnerError && partnerProfile) {
          partner = partnerProfile;
        }
      }
    }

    const response = {
      connected: couple.status === 'connected',
      inviteCode: couple.invite_code,
      status: couple.status,
      connectedAt: couple.connected_at,
      createdAt: couple.created_at,
      partner: partner ? {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        avatarUrl: partner.avatar_url,
      } : null,
    };

    console.log('커플 상태 응답:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error('커플 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
