/**
 * POST /api/upload-image
 * 
 * 이미지를 Supabase Storage에 업로드
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

    // FormData에서 파일과 메타데이터 추출
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const year = formData.get('year') as string;
    const month = formData.get('month') as string;
    const imageType = formData.get('type') as string; // 'calendar' | 'analysis'

    if (!file || !year || !month || !imageType) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 파일 확장자 추출
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    
    // 파일 경로: {user_id}/{year}/{month}/{type}_{timestamp}.{ext}
    const filePath = `${user.id}/${year}/${month}/${imageType}_${timestamp}.${fileExt}`;

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('financial-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage 업로드 오류:', uploadError);
      return NextResponse.json(
        { error: '이미지 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    // Public URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('financial-images')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
