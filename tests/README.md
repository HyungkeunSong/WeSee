# 🤖 WeSee AI 자동 테스트 시스템

GPT-4 Vision을 활용한 완전 자동화된 QA 테스트 시스템입니다.

## 🌟 주요 기능

### 1. AI 기반 시각적 테스트
- GPT-4 Vision이 화면을 보고 UI/UX 이슈를 자동으로 감지
- 레이아웃 문제, 접근성 이슈, 디자인 불일치 등을 자동 발견
- 모바일 반응형 디자인 자동 검증

### 2. 자동 테스트 케이스 생성
- 코드베이스를 분석하여 AI가 테스트 케이스를 자동 생성
- 사용자 스토리로부터 E2E 테스트 자동 생성
- 버그 리포트로부터 회귀 테스트 자동 생성

### 3. 지능형 버그 감지
- 테스트 실행 중 자동으로 버그를 탐지
- 심각도 및 카테고리별 분류
- 자동으로 HTML 버그 리포트 생성

### 4. 사용자 플로우 분석
- 전체 사용자 여정을 AI가 분석
- 각 단계의 UX 품질 평가
- 개선 제안 자동 생성

## 📁 프로젝트 구조

```
tests/
├── auth/                    # 인증 관련 테스트
│   ├── signup.spec.ts      # 회원가입 테스트
│   └── login.spec.ts       # 로그인 테스트
├── couple/                  # 커플 연결 테스트
│   └── connection.spec.ts  # 커플 초대 및 연결 테스트
├── financial/              # 재무 기능 테스트
│   └── upload.spec.ts      # 이미지 업로드 및 분석 테스트
├── profile/                # 프로필 및 설정 테스트
│   └── profile-settings.spec.ts
├── utils/                  # 유틸리티 및 헬퍼
│   ├── ai-vision.ts        # AI Vision 분석 유틸리티
│   ├── ai-bug-detector.ts  # 자동 버그 감지 시스템
│   ├── test-generator.ts   # AI 테스트 생성기
│   ├── test-helpers.ts     # 테스트 헬퍼 함수들
│   └── fixtures.ts         # Playwright 픽스처
└── test-assets/            # 테스트용 이미지 등
    └── images/
        └── receipt.jpg     # 테스트용 영수증 이미지
```

## 🚀 시작하기

### 1. 환경 설정

`.env.local` 파일에 OpenAI API 키를 추가하세요:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Playwright 브라우저 설치

```bash
npx playwright install
```

### 3. 테스트 실행

#### 전체 테스트 실행
```bash
npm test
```

#### UI 모드로 테스트 (추천)
```bash
npm run test:ui
```

#### 특정 테스트 그룹만 실행
```bash
npm run test:auth        # 인증 테스트만
npm run test:couple      # 커플 연결 테스트만
npm run test:financial   # 재무 기능 테스트만
npm run test:profile     # 프로필 테스트만
```

#### 헤드리스 모드 해제 (브라우저 보기)
```bash
npm run test:headed
```

#### 디버그 모드
```bash
npm run test:debug
```

#### 테스트 리포트 보기
```bash
npm run test:report
```

## 📊 테스트 리포트

테스트 실행 후 다음 위치에서 리포트를 확인할 수 있습니다:

### 1. Playwright HTML 리포트
- 위치: `test-results/html/index.html`
- 실행: `npm run test:report`
- 내용: 전체 테스트 결과, 스크린샷, 비디오, 트레이스

### 2. AI 분석 결과
- 위치: `test-results/ai-analysis/`
- 각 테스트별 AI 분석 결과 (JSON + PNG)
- UI/UX 이슈, 개선 제안 포함

### 3. AI 버그 리포트
- 위치: `test-results/bug-reports/`
- HTML 형식의 상세한 버그 리포트
- 스크린샷, 재현 단계, 수정 제안 포함

## 🎯 테스트 커버리지

### ✅ 구현된 테스트

#### 인증 (Auth)
- [x] 회원가입 페이지 렌더링
- [x] 회원가입 유효성 검증 (비밀번호 불일치, 짧은 비밀번호)
- [x] 완전한 회원가입 플로우 (AI 분석 포함)
- [x] 로그인 페이지 렌더링
- [x] 잘못된 로그인 정보 처리
- [x] 완전한 로그인 플로우
- [x] 모바일 반응형 테스트
- [x] 접근성 검증

#### 커플 연결 (Couple)
- [x] 초대 코드 생성 플로우
- [x] 완전한 커플 연결 플로우 (두 사용자)
- [x] 잘못된 초대 코드 처리
- [x] 이미 연결된 사용자 처리
- [x] 초대 코드 UI 복사 기능

#### 재무 기능 (Financial)
- [x] 업로드 페이지 렌더링
- [x] 파일 선택 UI 인터랙션
- [x] 다중 이미지 업로드 플로우
- [x] 잘못된 파일 형식 처리
- [x] 재무 분석 결과 표시
- [x] API 응답 시간 측정
- [x] 모바일 카메라 촬영 지원

#### 프로필 및 설정 (Profile)
- [x] 프로필 페이지 렌더링
- [x] 프로필 정보 표시
- [x] 프로필 사진 업로드
- [x] 설정 페이지 접근
- [x] 로그아웃 기능
- [x] 접근성 테스트
- [x] 모바일 반응형

## 🛠️ AI 기능 사용법

### 1. 페이지 분석

```typescript
import { analyzePageWithAI } from './utils/ai-vision';

const result = await analyzePageWithAI(
  page,
  '회원가입 페이지가 표시되어야 합니다...',
  '회원가입 페이지 컨텍스트'
);

console.log(result.passed);       // true/false
console.log(result.issues);       // 발견된 이슈 배열
console.log(result.suggestions);  // 개선 제안 배열
```

### 2. 사용자 플로우 분석

```typescript
import { analyzeUserFlow } from './utils/ai-vision';

const screenshots = [
  { step: '단계1', image: 'base64...', url: 'http://...' },
  { step: '단계2', image: 'base64...', url: 'http://...' },
];

const flowAnalysis = await analyzeUserFlow(
  screenshots,
  '회원가입부터 로그인까지의 플로우'
);

console.log(flowAnalysis.overallPassed);  // true/false
console.log(flowAnalysis.stepResults);    // 단계별 결과
console.log(flowAnalysis.flowAnalysis);   // 전체 분석
```

### 3. 접근성 분석

```typescript
import { analyzeAccessibility } from './utils/ai-vision';

const result = await analyzeAccessibility(page);

console.log(result.score);           // 0-100 점수
console.log(result.issues);          // 접근성 이슈
console.log(result.recommendations); // 개선 권장사항
```

### 4. 자동 버그 감지

```typescript
import { scanPageForBugs, saveBugReport } from './utils/ai-bug-detector';

// 페이지 스캔
const bugs = await scanPageForBugs(page, '회원가입 페이지');

// 버그가 발견되면
if (bugs.length > 0) {
  bugs.forEach(bug => {
    console.log(`[${bug.severity}] ${bug.title}`);
    console.log('  설명:', bug.description);
    console.log('  수정 제안:', bug.suggestions);
  });
}
```

### 5. AI 테스트 생성

```typescript
import { 
  generateTestsFromComponent,
  generateE2ETestFromUserStory 
} from './utils/test-generator';

// 컴포넌트로부터 테스트 생성
const testSuite = await generateTestsFromComponent(
  'src/app/signup/page.tsx',
  componentCode
);

// 사용자 스토리로부터 E2E 테스트 생성
const test = await generateE2ETestFromUserStory(
  '사용자가 회원가입하고 커플 초대 코드를 생성한다'
);
```

## 📝 테스트 작성 가이드

### 기본 테스트 구조

```typescript
import { test, expect } from '../utils/fixtures';
import { analyzePageWithAI, saveTestResult } from '../utils/ai-vision';

test.describe('기능 이름', () => {
  test('테스트 케이스 이름', async ({ authenticatedPage }) => {
    // 1. 페이지로 이동
    await authenticatedPage.goto('/page');
    await waitForPageLoad(authenticatedPage);
    
    // 2. 액션 수행
    await authenticatedPage.click('button');
    
    // 3. AI 분석
    const aiResult = await analyzePageWithAI(
      authenticatedPage,
      '기대하는 동작 설명',
      '컨텍스트'
    );
    
    // 4. 결과 저장
    saveTestResult('test-name', aiResult);
    
    // 5. 어설션
    expect(aiResult.passed).toBe(true);
  });
});
```

### 픽스처 사용

```typescript
// 인증이 필요한 테스트
test('프로필 확인', async ({ authenticatedPage, testUser }) => {
  // authenticatedPage는 이미 로그인된 상태
  // testUser에는 생성된 사용자 정보 포함
  await authenticatedPage.goto('/profile');
});

// AI 분석 헬퍼 사용
test('UI 검증', async ({ page, aiAnalysis }) => {
  await page.goto('/page');
  
  const result = await aiAnalysis(
    '페이지가 올바르게 표시되어야 합니다'
  );
});
```

## 🔧 CI/CD 통합

### GitHub Actions 예시

```yaml
name: AI 자동 테스트

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run tests
        run: npm run test:ci
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## 💡 베스트 프랙티스

### 1. AI 분석 활용
- 모든 주요 사용자 플로우에 AI 분석 추가
- 스크린샷을 안정화한 후 AI 분석 수행
- AI 결과를 파일로 저장하여 히스토리 추적

### 2. 테스트 격리
- 각 테스트는 독립적으로 실행 가능해야 함
- `testUser` 픽스처를 사용하여 매번 새로운 사용자 생성
- 테스트 후 정리(cleanup) 수행

### 3. 대기 시간
- `waitForPageLoad()` 사용하여 페이지 로딩 완료 대기
- `stabilizeForScreenshot()` 사용하여 애니메이션 완료 대기
- API 응답에 충분한 타임아웃 설정

### 4. 에러 처리
- 모든 AI 분석에 try-catch 추가
- 에러 발생 시에도 테스트가 계속 진행되도록
- 에러를 로그로 남기고 리포트에 포함

## 🐛 문제 해결

### OpenAI API 키 오류
```
Error: OPENAI_API_KEY 환경변수가 설정되지 않았습니다.
```
**해결:** `.env.local` 파일에 `OPENAI_API_KEY` 추가

### 테스트 타임아웃
```
Test timeout of 120000ms exceeded
```
**해결:** AI 분석에 시간이 오래 걸릴 수 있으므로 타임아웃 증가
```typescript
test.setTimeout(180000); // 3분
```

### 브라우저 실행 오류
```
Error: Failed to launch browser
```
**해결:** Playwright 브라우저 재설치
```bash
npx playwright install --with-deps
```

### 테스트 이미지 없음
```
⚠️ 테스트 이미지가 없어 스킵
```
**해결:** `tests/test-assets/images/` 폴더에 테스트용 영수증 이미지 추가

## 📚 추가 리소스

- [Playwright 공식 문서](https://playwright.dev/)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [WeSee 프로젝트 문서](../README.md)

## 🤝 기여하기

새로운 테스트를 추가하거나 개선 사항이 있다면:

1. 적절한 폴더에 `.spec.ts` 파일 생성
2. AI 분석을 활용한 테스트 작성
3. 테스트 실행 및 검증
4. PR 생성

## 📄 라이선스

이 테스트 시스템은 WeSee 프로젝트의 일부입니다.
