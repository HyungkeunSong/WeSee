# 같이봄 (WeSee) 🏠💰

> 부부가 돈 이야기를 덜 힘들게 하도록 돕는 재무 공유 앱

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HyungkeunSong/WeSee)

---

## 📌 프로젝트 소개

**같이봄 (WeSee)**은 토스 등 개인 자산관리 앱의 캡처 화면을 AI로 자동 인식하여,  
부부의 월간 재무 데이터를 합산하고 대화 가능한 형태로 제공하는 **PWA 기반 웹 앱**입니다.

### 핵심 가치
- 🚫 **수동 입력 없음**: 월 1회 캡처만으로 완료
- 🤝 **관계 중심**: 부부 합산 관점 우선
- 🤖 **AI 자동화**: GPT-4 Vision으로 이미지 → 데이터 변환
- 📱 **네이티브 앱 경험**: PWA로 아이폰 홈 화면에 추가 가능

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Type Safety**: [TypeScript 5](https://www.typescriptlang.org/)
- **State Management**: [TanStack Query](https://tanstack.com/query)

### Backend & Infrastructure
- **BaaS**: [Supabase](https://supabase.com/)
  - PostgreSQL Database
  - Authentication
  - File Storage
  - Row Level Security

### AI/OCR
- **Vision AI**: [OpenAI GPT-4 Vision API](https://platform.openai.com/docs/guides/vision)

### Deployment
- **Hosting**: [Vercel](https://vercel.com/)

---

## 🚀 Quick Start

### 5분 안에 배포하기

전체 가이드는 **[QUICK_START.md](./QUICK_START.md)** 참고

```bash
# 1. 환경 변수 준비
# .env.local 파일 생성 및 설정 필요

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. Vercel에 배포
# https://vercel.com/dashboard 에서 GitHub 연결
```

---

## 📱 주요 기능

### 1. 부부 연결 시스템
- 초대 코드 기반 커플 연결
- 각자의 재무 데이터 자동 합산

### 2. 이미지 기반 데이터 입력
- 토스/금융앱 캡처 화면 업로드
- GPT-4 Vision으로 자동 인식
- 수입/지출 카테고리 자동 분류

### 3. 월간 캘린더 뷰
- 일별 지출/수입 한눈에 확인
- 부부 데이터 자동 합산 표시

### 4. 재무 분석
- 월간 소비 요약
- 카테고리별 지출 분석
- 시각적 차트와 인사이트

### 5. 프로필 관리
- 아바타 업로드
- 커플 연결 상태 확인

---

## 📂 프로젝트 구조

```
/wesee
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 페이지 (로그인/회원가입)
│   │   ├── api/               # API Routes
│   │   ├── home/              # 홈 대시보드
│   │   ├── upload/            # 이미지 업로드
│   │   ├── analysis/          # 재무 분석
│   │   └── profile/           # 프로필 관리
│   ├── components/            # React 컴포넌트
│   ├── hooks/                 # Custom React Hooks
│   ├── lib/                   # 유틸리티
│   │   ├── supabase/          # Supabase 클라이언트
│   │   ├── openai/            # OpenAI API
│   │   └── financial/         # 재무 데이터 처리
│   └── types/                 # TypeScript 타입 정의
├── public/                    # 정적 파일
│   └── manifest.json          # PWA 매니페스트
├── supabase/
│   └── migrations/            # 데이터베이스 마이그레이션
├── DEPLOYMENT_GUIDE.md        # 상세 배포 가이드
└── QUICK_START.md             # 빠른 시작 가이드
```

---

## 🌐 배포하기

### 사전 준비
- ✅ Supabase 프로젝트 생성
- ✅ OpenAI API 키 발급
- ✅ Vercel 계정

### 배포 단계

1. **환경 변수 설정**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=your_deployed_url
```

2. **Vercel 배포**

- GitHub 연결
- Root Directory: `wesee` 선택
- 환경 변수 입력
- Deploy!

3. **Supabase 마이그레이션**

```sql
-- supabase/migrations 폴더의 SQL 파일들을 순서대로 실행
```

자세한 내용은 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** 참고

---

## 📱 PWA 설치 (모바일)

### iPhone
1. Safari로 배포된 URL 접속
2. 공유 버튼 (⬆️) → "홈 화면에 추가"
3. 완료!

### Android
1. Chrome으로 접속
2. 메뉴 (⋮) → "홈 화면에 추가"
3. 완료!

---

## 💰 비용 안내

### 무료 티어로 시작
- **Vercel**: 무료 (개인 프로젝트)
- **Supabase**: 무료 (500MB DB, 1GB Storage)
- **OpenAI API**: 사용량 기반

### 예상 월간 비용
- 부부 2명 × 월 1회 업로드 = **약 $0.10~0.50**

---

## 🔒 보안 & 프라이버시

- ✅ Supabase Row Level Security (RLS) 적용
- ✅ 커플 간 데이터만 공유 (타인 접근 불가)
- ✅ HTTPS 전송 암호화
- ✅ 이미지는 인증된 사용자만 접근 가능

---

## 🐛 문제 해결

### 로그인이 안 돼요
→ Supabase Dashboard에서 Redirect URLs 확인

### 이미지 업로드가 안 돼요
→ Supabase Storage 정책 및 버킷 확인

### 커플 연결이 안 돼요
→ 초대 코드 만료 여부 확인 (24시간 유효)

더 많은 문제 해결 방법은 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)의 "문제 해결" 섹션 참고

---

## 📝 개발 가이드

### 로컬 개발 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집하여 실제 값 입력

# 개발 서버 실행
npm run dev
```

### 주요 명령어

```bash
# 개발 서버 (네트워크에서 접근 가능)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린터 실행
npm run lint
```

---

## 🤝 기여하기

현재는 개인 프로젝트입니다.  
피드백이나 제안은 Issues를 통해 남겨주세요!

---

## 📄 라이선스

MIT License

---

## 👨‍💑‍👨 만든 이

**같이봄 팀**

---

## 🔗 관련 문서

- 📖 [상세 배포 가이드](./DEPLOYMENT_GUIDE.md)
- ⚡ [5분 빠른 시작](./QUICK_START.md)
- 📋 [제품 기획서 (PRD)](../PRD.md)
- 🎨 [UX 개선 문서](../COUPLE_CONNECTION_UX_IMPROVEMENTS.md)

---

**같이봄과 함께, 부부의 재무 대화를 더 쉽게 🏠💙**

