-- ============================================
-- Avatar 업로드를 위한 Storage 정책 수정
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- 새로운 정책 생성: financial-images 버킷에서 자신의 폴더에 접근
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'financial-images' AND
    (
      -- {user_id}/... 형식
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR
      -- avatars/{user_id}/... 형식
      ((storage.foldername(name))[1] = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[2])
    )
  );

CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'financial-images' AND
    (
      -- {user_id}/... 형식 (자신의 financial 이미지)
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR
      -- avatars/{user_id}/... 형식 (자신의 아바타)
      ((storage.foldername(name))[1] = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[2])
      OR
      -- avatars/{partner_id}/... 형식 (커플 파트너의 아바타)
      (
        (storage.foldername(name))[1] = 'avatars' AND
        EXISTS (
          SELECT 1 FROM public.couples
          WHERE status = 'connected'
          AND (
            (user1_id = auth.uid() AND user2_id::TEXT = (storage.foldername(name))[2]) OR
            (user2_id = auth.uid() AND user1_id::TEXT = (storage.foldername(name))[2])
          )
        )
      )
    )
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'financial-images' AND
    (
      -- {user_id}/... 형식
      auth.uid()::TEXT = (storage.foldername(name))[1]
      OR
      -- avatars/{user_id}/... 형식
      ((storage.foldername(name))[1] = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[2])
    )
  );

-- financial-images 버킷을 public으로 변경 (프로필 사진 접근을 위해)
UPDATE storage.buckets
SET public = true
WHERE id = 'financial-images';
