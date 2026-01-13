-- ============================================
-- 같이봄 (WeSee) 초기 데이터베이스 스키마
-- ============================================

-- 1. profiles 테이블: 사용자 프로필 정보
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. couples 테이블: 부부 연결 정보
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- 3. financial_records 테이블: 월간 재무 데이터
CREATE TABLE IF NOT EXISTS public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  data JSONB NOT NULL, -- 구조화된 재무 데이터 (날짜별 수입/지출, 카테고리별 합계 등)
  image_urls TEXT[], -- 업로드한 이미지 URL 배열
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month) -- 한 사용자는 같은 년/월에 하나의 레코드만
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- couples 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_couples_user1 ON public.couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2 ON public.couples(user2_id);
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON public.couples(invite_code);

-- financial_records 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_financial_records_user ON public.financial_records(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_couple ON public.financial_records(couple_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_date ON public.financial_records(year, month);

-- ============================================
-- Row Level Security (RLS) 정책
-- ============================================

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- profiles 정책
-- 1. 모든 사용자는 자신의 프로필을 읽을 수 있음
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. 모든 사용자는 자신의 프로필을 수정할 수 있음
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. 새 사용자 가입 시 프로필 생성 가능
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- couples 정책
-- 1. 부부 중 한 명이면 couple 정보를 볼 수 있음
CREATE POLICY "Couple members can view couple info"
  ON public.couples FOR SELECT
  USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );

-- 2. user1만 couple 레코드를 생성할 수 있음 (초대 코드 생성자)
CREATE POLICY "Users can create couple"
  ON public.couples FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

-- 3. 부부 중 한 명이면 couple 정보를 수정할 수 있음 (연결 상태 업데이트)
CREATE POLICY "Couple members can update couple info"
  ON public.couples FOR UPDATE
  USING (
    auth.uid() = user1_id OR 
    auth.uid() = user2_id
  );

-- financial_records 정책
-- 1. 같은 couple에 속한 사용자는 서로의 재무 데이터를 볼 수 있음
CREATE POLICY "Couple members can view financial records"
  ON public.financial_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE id = financial_records.couple_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- 2. 사용자는 자신의 재무 데이터를 생성할 수 있음
CREATE POLICY "Users can insert own financial records"
  ON public.financial_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. 사용자는 자신의 재무 데이터를 수정할 수 있음
CREATE POLICY "Users can update own financial records"
  ON public.financial_records FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. 사용자는 자신의 재무 데이터를 삭제할 수 있음
CREATE POLICY "Users can delete own financial records"
  ON public.financial_records FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 트리거: updated_at 자동 업데이트
-- ============================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles 테이블 트리거
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- financial_records 테이블 트리거
CREATE TRIGGER update_financial_records_updated_at
  BEFORE UPDATE ON public.financial_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 함수: 초대 코드 생성
-- ============================================

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 혼동되는 문자 제외 (I, O, 0, 1)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Storage 버킷 생성 (이미지 저장용)
-- ============================================

-- financial-images 버킷 생성 (이미지 업로드용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('financial-images', 'financial-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책: 사용자는 자신의 이미지를 업로드/조회할 수 있음
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'financial-images' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'financial-images' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'financial-images' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- ============================================
-- 초기 데이터 및 헬퍼 함수
-- ============================================

-- 사용자 가입 시 자동으로 프로필 생성하는 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 새 사용자가 추가되면 자동으로 프로필 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
