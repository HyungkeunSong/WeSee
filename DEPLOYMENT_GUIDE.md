# 배포 가이드 📱

같이봄(WeSee) 앱을 실제로 배포하고 폰에서 사용하는 방법입니다.

## 📋 배포 전 체크리스트

배포하기 전에 다음 항목들이 준비되어 있는지 확인하세요:

- [ ] Vercel 계정 (무료)
- [ ] GitHub 계정
- [ ] Supabase 프로젝트가 설정되어 있음
- [ ] OpenAI API 키가 있음
- [ ] 환경 변수들을 알고 있음 (.env.local 파일 참고)

---

## 🚀 1단계: GitHub에 코드 푸시

### 1.1 Git 초기화 (처음인 경우)

```bash
cd /Users/songhyeong-geun/Desktop/WeSee/wesee
git init
git add .
git commit -m "Initial commit: WeSee app ready for deployment"
```

### 1.2 GitHub에 새 저장소 만들기

1. [GitHub](https://github.com/new)에서 새 저장소 생성
2. 저장소 이름: `wesee` (원하는 이름으로)
3. **Private** 선택 (개인 프로젝트이므로)
4. README 추가 안함 (이미 있음)

### 1.3 원격 저장소 연결 및 푸시

```bash
git remote add origin https://github.com/YOUR_USERNAME/wesee.git
git branch -M main
git push -u origin main
```

---

## 🌐 2단계: Vercel에 배포

### 2.1 Vercel에서 새 프로젝트 생성

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 연결
4. `wesee` 저장소 선택 후 "Import"

### 2.2 프로젝트 설정

**Root Directory**: `wesee` 선택 (monorepo 구조이므로)

**Framework Preset**: Next.js (자동 감지됨)

**Build and Output Settings**: 기본값 유지

### 2.3 환경 변수 설정

"Environment Variables" 섹션에서 다음 변수들을 추가하세요:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI API
OPENAI_API_KEY=sk-your_openai_api_key_here

# 앱 URL (나중에 업데이트)
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

#### 환경 변수 찾는 방법:

**Supabase 변수:**
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. Settings → API
4. `URL`, `anon key`, `service_role key` 복사

**OpenAI API 키:**
1. [OpenAI Platform](https://platform.openai.com/api-keys) 접속
2. API Keys 메뉴
3. "+ Create new secret key" 클릭
4. 생성된 키 복사 (다시 볼 수 없으니 안전한 곳에 저장)

### 2.4 배포하기

1. "Deploy" 버튼 클릭
2. 빌드 과정 확인 (2-3분 소요)
3. 배포 완료! 🎉

배포가 완료되면 다음과 같은 URL을 받게 됩니다:
```
https://wesee-abc123.vercel.app
```

### 2.5 앱 URL 환경 변수 업데이트

1. Vercel Dashboard → 프로젝트 → Settings → Environment Variables
2. `NEXT_PUBLIC_APP_URL` 값을 실제 배포된 URL로 업데이트
3. "Save" 후 재배포

---

## 🔧 3단계: Supabase 설정 업데이트

### 3.1 Redirect URLs 추가

Vercel URL을 Supabase 인증 설정에 추가해야 합니다:

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. Authentication → URL Configuration
3. **Site URL**: `https://your-project.vercel.app` 입력
4. **Redirect URLs**에 추가:
   ```
   https://your-project.vercel.app/**
   ```
5. Save

### 3.2 Storage CORS 설정 확인

1. Storage → Policies 확인
2. `avatars`, `receipts` 버킷이 올바른 RLS 정책을 가지고 있는지 확인
3. 문제가 있다면 기존 migration 파일들을 다시 실행

---

## 📱 4단계: 폰에서 앱 설치하기

### iPhone (iOS) 사용자

#### 4.1 Safari에서 접속
1. iPhone의 **Safari** 브라우저 열기
2. 배포된 URL 접속: `https://your-project.vercel.app`

#### 4.2 홈 화면에 추가
1. 하단 공유 버튼 (⬆️) 탭
2. "홈 화면에 추가" 선택
3. 이름 확인: "같이봄" (원하는 대로 수정 가능)
4. "추가" 탭

#### 4.3 앱 실행
- 홈 화면에 생긴 "같이봄" 아이콘 탭
- 네이티브 앱처럼 전체 화면으로 실행됩니다!

### Android 사용자

#### 4.1 Chrome에서 접속
1. Chrome 브라우저 열기
2. 배포된 URL 접속

#### 4.2 홈 화면에 추가
1. 우측 상단 ⋮ 메뉴
2. "홈 화면에 추가" 선택
3. "추가" 탭

#### 4.3 앱 실행
- 홈 화면의 아이콘으로 실행

---

## 👫 5단계: 부부 연결하기

### 5.1 첫 번째 사용자 (예: 본인)
1. 앱 실행
2. 회원가입 (이메일/비밀번호)
3. 프로필 설정 (이름, 아바타)
4. "설정" → "커플 연결" → "초대 코드 생성"
5. **초대 코드 복사** (예: `ABC123`)

### 5.2 두 번째 사용자 (예: 와이프)
1. 앱 실행
2. 회원가입
3. 프로필 설정
4. "설정" → "커플 연결" → "초대 코드로 참여"
5. 받은 초대 코드 입력
6. 연결 완료! 🎊

---

## 🔄 6단계: 앱 업데이트하기

코드를 수정하고 업데이트하려면:

```bash
# 코드 수정 후
git add .
git commit -m "업데이트 내용"
git push
```

Vercel이 자동으로:
- 새 코드 감지
- 빌드
- 배포

약 2-3분 후 앱이 자동으로 업데이트됩니다!

---

## 🐛 문제 해결

### 배포는 성공했는데 앱이 작동 안 해요

1. **Vercel Dashboard → 프로젝트 → Deployments → 최신 배포 → "View Function Logs"**
2. 에러 메시지 확인
3. 대부분 환경 변수 문제:
   - 모든 환경 변수가 입력되었나요?
   - 오타는 없나요?
   - Supabase URL에 `https://`가 포함되어 있나요?

### 로그인이 안 돼요

1. Supabase Dashboard → Authentication → URL Configuration
2. Redirect URLs에 Vercel URL이 추가되어 있는지 확인
3. Site URL이 올바른지 확인

### 이미지 업로드가 안 돼요

1. Supabase Dashboard → Storage
2. `receipts` 버킷이 생성되어 있는지 확인
3. Storage policies (RLS)가 올바른지 확인

### 환경 변수 확인 방법

Vercel Dashboard → 프로젝트 → Settings → Environment Variables에서 확인

### 로그 확인하기

**실시간 로그:**
```bash
vercel logs --follow
```

**최근 로그:**
Vercel Dashboard → 프로젝트 → Deployments → 최신 배포 → View Function Logs

---

## 💰 비용 안내

### 무료로 사용 가능
- **Vercel**: Free tier (개인 프로젝트 충분)
- **Supabase**: Free tier (DB 500MB, Storage 1GB)
- **OpenAI API**: 사용량 기반 ($0.01 per 1K tokens)

### 예상 비용 (월간)
- Vercel: $0 (무료)
- Supabase: $0 (무료 티어 내)
- OpenAI API: 월 1회 업로드 × 2명 = 약 $0.10~0.50

**총 예상 비용: 월 $1 미만** 💚

---

## 📝 팁

### 커스텀 도메인 연결 (선택)
1. 도메인 구매 (예: wesee.app)
2. Vercel Dashboard → 프로젝트 → Settings → Domains
3. 도메인 추가 및 DNS 설정
4. 무료 SSL 인증서 자동 발급

### 프로덕션 준비 체크리스트
- [ ] 환경 변수 모두 설정됨
- [ ] Supabase RLS 정책 활성화 확인
- [ ] OpenAI API 키 사용량 제한 설정
- [ ] 에러 추적 설정 (선택: Sentry)
- [ ] 분석 도구 설정 (선택: Google Analytics)

---

## 🎉 완료!

이제 여러분과 와이프의 폰에서 "같이봄"을 사용할 수 있습니다!

문제가 생기면:
1. Vercel logs 확인
2. Supabase logs 확인
3. 브라우저 개발자 도구 콘솔 확인

**즐거운 재무 공유 되세요! 💑💰**
