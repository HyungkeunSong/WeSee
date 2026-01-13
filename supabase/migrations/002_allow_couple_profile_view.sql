-- ============================================
-- 커플 멤버끼리 서로의 프로필을 볼 수 있도록 RLS 정책 추가
-- ============================================

-- 커플로 연결된 사용자는 서로의 프로필을 볼 수 있음
CREATE POLICY "Couple members can view each other's profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE status = 'connected'
      AND (
        (user1_id = auth.uid() AND user2_id = id) OR
        (user2_id = auth.uid() AND user1_id = id)
      )
    )
  );
