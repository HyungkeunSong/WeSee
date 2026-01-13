# 빠른 시작 가이드 🚀

## 5분 안에 배포하기

### 1. GitHub에 푸시 (2분)

```bash
cd /Users/songhyeong-geun/Desktop/WeSee/wesee

# Git 초기화 (처음인 경우만)
git init
git add .
git commit -m "Initial commit"

# GitHub 저장소 만들고 연결
# https://github.com/new 에서 새 저장소 생성 후:
git remote add origin https://github.com/YOUR_USERNAME/wesee.git
git branch -M main
git push -u origin main
```

### 2. Vercel 배포 (2분)

1. https://vercel.com/dashboard 접속
2. "Add New..." → "Project"
3. GitHub 저장소 선택 (`wesee`)
4. **Root Directory**: `wesee` 선택
5. **Environment Variables** 추가:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx...
OPENAI_API_KEY=sk-xxxx...
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

6. "Deploy" 클릭!

### 3. Supabase 설정 (1분)

1. https://supabase.com/dashboard → 프로젝트
2. **Authentication → URL Configuration**
3. **Site URL**: `https://your-project.vercel.app`
4. **Redirect URLs**: `https://your-project.vercel.app/**`
5. Save

### 4. 폰에 설치 (1분)

**iPhone:**
1. Safari로 `https://your-project.vercel.app` 접속
2. 공유 버튼 → "홈 화면에 추가"
3. 완료!

**Android:**
1. Chrome으로 접속
2. 메뉴 → "홈 화면에 추가"
3. 완료!

---

## 환경 변수 어디서 찾나요?

### Supabase
https://supabase.com/dashboard → 프로젝트 → Settings → API
- `URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon/public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### OpenAI
https://platform.openai.com/api-keys
- "+ Create new secret key" → `OPENAI_API_KEY`

---

## 문제 해결

### 배포 실패
→ Vercel Dashboard → 프로젝트 → Deployments → View Logs 확인

### 로그인 안됨
→ Supabase Redirect URLs 확인

### 이미지 업로드 안됨
→ Supabase Storage → `receipts` 버킷 확인

---

## 코드 업데이트

```bash
# 코드 수정 후
git add .
git commit -m "수정 내용"
git push
```

Vercel이 자동으로 재배포합니다! (2-3분)

---

## 더 자세한 내용

👉 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** 참고

---

**이제 사용하세요! 💑**
