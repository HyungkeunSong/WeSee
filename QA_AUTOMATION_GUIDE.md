# 🤖 WeSee QA 자동화 가이드

## 목차
1. [개요](#개요)
2. [빠른 시작](#빠른-시작)
3. [테스트 실행 방법](#테스트-실행-방법)
4. [AI 기반 테스트 작성](#ai-기반-테스트-작성)
5. [버그 리포트 활용](#버그-리포트-활용)
6. [고급 기능](#고급-기능)

## 개요

WeSee의 QA 자동화 시스템은 GPT-4 Vision을 활용하여 다음을 수행합니다:

✅ **자동 UI/UX 검증** - AI가 화면을 보고 문제점 감지  
✅ **자동 테스트 생성** - 코드에서 테스트 케이스 자동 생성  
✅ **버그 자동 감지** - 테스트 실행 중 버그 자동 발견  
✅ **접근성 검사** - WCAG 가이드라인 준수 자동 확인  
✅ **상세한 리포트** - HTML 형식의 이해하기 쉬운 리포트  

## 빠른 시작

### 1단계: 환경 설정

```bash
# 프로젝트 디렉토리로 이동
cd wesee

# OpenAI API 키 설정 (.env.local에 추가)
echo "OPENAI_API_KEY=your_api_key_here" >> .env.local

# Playwright 브라우저 설치
npx playwright install
```

### 2단계: 첫 테스트 실행

```bash
# UI 모드로 테스트 실행 (추천)
npm run test:ui
```

UI가 열리면 원하는 테스트를 선택하고 실행할 수 있습니다.

### 3단계: 리포트 확인

테스트 완료 후 두 가지 리포트를 확인하세요:

1. **Playwright 리포트**: `npm run test:report`
2. **AI 버그 리포트**: `test-results/bug-reports/` 폴더의 HTML 파일 열기

## 테스트 실행 방법

### 모든 테스트 실행

```bash
npm test
```

### 카테고리별 실행

```bash
npm run test:auth        # 로그인/회원가입 테스트
npm run test:couple      # 커플 연결 테스트
npm run test:financial   # 재무 기능 테스트
npm run test:profile     # 프로필/설정 테스트
```

### 특정 파일만 실행

```bash
npx playwright test tests/auth/signup.spec.ts
```

### 특정 테스트만 실행

```bash
npx playwright test -g "회원가입 페이지 렌더링"
```

### 브라우저 보면서 실행 (디버깅)

```bash
npm run test:headed       # 브라우저가 보임
npm run test:debug        # 단계별 디버깅
```

### 특정 브라우저에서만 실행

```bash
npx playwright test --project="iPhone 13 Pro"
npx playwright test --project="Desktop Chrome"
```

## AI 기반 테스트 작성

### 기본 패턴

```typescript
import { test, expect } from '../utils/fixtures';
import { analyzePageWithAI, saveTestResult } from '../utils/ai-vision';
import { waitForPageLoad, stabilizeForScreenshot } from '../utils/test-helpers';

test('회원가입 페이지 테스트', async ({ page }) => {
  // 1. 페이지로 이동
  await page.goto('/signup');
  await waitForPageLoad(page);
  await stabilizeForScreenshot(page);

  // 2. AI가 화면 분석
  const aiResult = await analyzePageWithAI(
    page,
    '회원가입 페이지가 표시되어야 합니다. 이름, 이메일, 비밀번호 입력 필드와 회원가입 버튼이 있어야 합니다.',
    '회원가입 페이지 초기 로딩'
  );

  // 3. 결과 저장
  saveTestResult('signup-page-render', aiResult);

  // 4. AI가 발견한 이슈 확인
  console.log('AI 분석 결과:', {
    통과: aiResult.passed,
    이슈: aiResult.issues,
    제안: aiResult.suggestions
  });

  // 5. 심각한 이슈가 있으면 테스트 실패
  expect(aiResult.issues.length).toBe(0);
});
```

### 사용자 플로우 테스트

```typescript
test('완전한 회원가입 플로우', async ({ page }) => {
  const screenshots: { step: string; image: string; url: string }[] = [];

  // 단계 1: 폼 작성
  await page.goto('/signup');
  await page.fill('input#email', 'test@example.com');
  await page.fill('input#password', 'password123');
  
  let screenshot = await page.screenshot({ fullPage: true });
  screenshots.push({
    step: '회원가입 폼 작성',
    image: screenshot.toString('base64'),
    url: page.url()
  });

  // 단계 2: 제출
  await page.click('button[type="submit"]');
  await page.waitForURL('/home');
  
  screenshot = await page.screenshot({ fullPage: true });
  screenshots.push({
    step: '회원가입 완료',
    image: screenshot.toString('base64'),
    url: page.url()
  });

  // AI가 전체 플로우 분석
  const { analyzeUserFlow } = await import('../utils/ai-vision');
  const flowAnalysis = await analyzeUserFlow(
    screenshots,
    '사용자가 회원가입하고 홈으로 이동하는 플로우'
  );

  console.log('플로우 분석:', flowAnalysis);
  expect(flowAnalysis.overallPassed).toBe(true);
});
```

### 접근성 테스트

```typescript
test('접근성 검증', async ({ page }) => {
  await page.goto('/signup');
  
  const { analyzeAccessibility } = await import('../utils/ai-vision');
  const result = await analyzeAccessibility(page);

  console.log('접근성 점수:', result.score, '/100');
  console.log('이슈:', result.issues);
  console.log('권장사항:', result.recommendations);

  // 70점 이상이어야 통과
  expect(result.score).toBeGreaterThan(70);
});
```

### 자동 버그 감지

```typescript
test('페이지 자동 버그 스캔', async ({ page }) => {
  await page.goto('/signup');
  
  const { scanPageForBugs } = await import('../utils/ai-bug-detector');
  const bugs = await scanPageForBugs(page, '회원가입 페이지');

  if (bugs.length > 0) {
    console.log(`🐛 ${bugs.length}개의 버그 발견:`);
    bugs.forEach(bug => {
      console.log(`  [${bug.severity}] ${bug.title}`);
      console.log(`    - ${bug.description}`);
      console.log(`    수정 제안:`, bug.suggestions);
    });
  }

  // Critical 버그가 없어야 함
  const criticalBugs = bugs.filter(b => b.severity === 'critical');
  expect(criticalBugs.length).toBe(0);
});
```

## 버그 리포트 활용

### 자동 생성된 버그 리포트 보기

1. 테스트 실행 완료
2. `test-results/bug-reports/` 폴더 열기
3. 가장 최근 HTML 파일 열기

### 버그 리포트에 포함된 정보

- **전체 점수**: 0-100점
- **버그 목록**: 심각도별 분류
- **스크린샷**: 각 버그가 발견된 화면
- **재현 단계**: 버그를 다시 재현하는 방법
- **수정 제안**: AI가 제안하는 해결 방법

### 버그 리포트 활용 워크플로우

```
1. 테스트 실행
   ↓
2. 버그 리포트 생성됨
   ↓
3. HTML 리포트 확인
   ↓
4. Critical/High 버그 우선 수정
   ↓
5. 회귀 테스트 추가
   ↓
6. 다시 테스트 실행
```

## 고급 기능

### 1. AI로 테스트 자동 생성

```typescript
import { generateTestsFromComponent } from './utils/test-generator';
import * as fs from 'fs';

// 컴포넌트 파일 읽기
const componentCode = fs.readFileSync('src/app/signup/page.tsx', 'utf-8');

// AI가 테스트 생성
const testSuite = await generateTestsFromComponent(
  'src/app/signup/page.tsx',
  componentCode
);

console.log('생성된 테스트:', testSuite.tests.length);
```

### 2. 사용자 스토리로부터 테스트 생성

```typescript
import { generateE2ETestFromUserStory } from './utils/test-generator';

const userStory = `
As a user
I want to sign up for the app
So that I can start using the financial tracker
`;

const test = await generateE2ETestFromUserStory(userStory);
console.log('생성된 테스트 코드:', test.code);
```

### 3. 버그 리포트로부터 회귀 테스트 생성

```typescript
import { generateRegressionTest } from './utils/test-generator';

const bugReport = {
  title: '회원가입 버튼이 작동하지 않음',
  description: '비밀번호를 입력해도 회원가입 버튼이 활성화되지 않음',
  stepsToReproduce: [
    '회원가입 페이지로 이동',
    '이메일과 비밀번호 입력',
    '회원가입 버튼 클릭 시도'
  ],
  expectedBehavior: '버튼이 활성화되고 클릭 가능해야 함',
  actualBehavior: '버튼이 비활성화 상태로 유지됨'
};

const regressionTest = await generateRegressionTest(bugReport);
console.log('회귀 테스트 생성됨:', regressionTest.testName);
```

### 4. 화면 비교 테스트

```typescript
import { compareScreenshotsWithAI } from './utils/ai-vision';

// Before 스크린샷
const before = await page.screenshot({ fullPage: true });

// 다크모드 토글
await page.click('#dark-mode-toggle');

// After 스크린샷
const after = await page.screenshot({ fullPage: true });

// AI가 두 화면 비교
const comparison = await compareScreenshotsWithAI(
  before.toString('base64'),
  after.toString('base64'),
  '다크모드 전후 비교'
);

console.log('유사도:', comparison.similarity);
console.log('차이점:', comparison.differences);
```

### 5. 모바일 반응형 자동 테스트

```typescript
const viewports = [
  { width: 375, height: 667, name: 'iPhone SE' },
  { width: 390, height: 844, name: 'iPhone 13 Pro' },
  { width: 360, height: 740, name: 'Galaxy S21' },
];

for (const viewport of viewports) {
  await page.setViewportSize(viewport);
  await page.goto('/signup');
  
  const aiResult = await analyzePageWithAI(
    page,
    `${viewport.name}에서 모든 요소가 잘 보이고 사용하기 쉬워야 합니다.`,
    `${viewport.name} 반응형 테스트`
  );
  
  console.log(`${viewport.name} 결과:`, aiResult.passed ? '✅' : '❌');
}
```

## 실전 예제

### 예제 1: 신규 기능 테스트 작성

새로운 "비밀번호 재설정" 기능을 추가했다면:

```typescript
test.describe('비밀번호 재설정', () => {
  test('비밀번호 재설정 플로우', async ({ page }) => {
    // 1. 로그인 페이지에서 "비밀번호 찾기" 클릭
    await page.goto('/login');
    await page.click('a:has-text("비밀번호 찾기")');
    
    // 2. AI 분석
    const step1Analysis = await analyzePageWithAI(
      page,
      '비밀번호 재설정 페이지가 표시되어야 합니다.',
      '비밀번호 재설정 페이지'
    );
    
    // 3. 이메일 입력
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("재설정 링크 전송")');
    
    // 4. 성공 메시지 확인
    const step2Analysis = await analyzePageWithAI(
      page,
      '이메일이 전송되었다는 성공 메시지가 표시되어야 합니다.',
      '재설정 링크 전송 완료'
    );
    
    expect(step1Analysis.passed && step2Analysis.passed).toBe(true);
  });
});
```

### 예제 2: 기존 버그 수정 후 회귀 테스트

버그를 수정했다면 같은 버그가 다시 발생하지 않도록:

```typescript
test('회귀: 빈 폼으로 제출 시 에러 메시지 표시', async ({ page }) => {
  // 이전에 빈 폼으로 제출했을 때 앱이 크래시되는 버그가 있었음
  await page.goto('/signup');
  
  // 아무것도 입력하지 않고 제출
  await page.click('button[type="submit"]');
  
  // AI가 에러 메시지가 적절하게 표시되는지 확인
  const aiResult = await analyzePageWithAI(
    page,
    '빈 폼으로 제출했을 때 명확한 에러 메시지가 표시되어야 합니다. 앱이 크래시되어서는 안 됩니다.',
    '빈 폼 제출 에러 처리'
  );
  
  expect(aiResult.passed).toBe(true);
});
```

### 예제 3: 성능 테스트와 AI 분석 결합

```typescript
test('이미지 업로드 성능 및 UX', async ({ page }) => {
  await page.goto('/upload');
  
  const startTime = Date.now();
  
  // 이미지 업로드
  await page.setInputFiles('input[type="file"]', 'test-image.jpg');
  
  // API 응답 대기
  await page.waitForResponse(r => r.url().includes('/api/process-images'));
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log('업로드 시간:', duration, 'ms');
  
  // AI가 로딩 UX 평가
  const aiResult = await analyzePageWithAI(
    page,
    '이미지 업로드 중 로딩 인디케이터가 명확하게 표시되어야 하고, 사용자가 진행 상황을 알 수 있어야 합니다.',
    '이미지 업로드 UX'
  );
  
  // 성능과 UX 모두 통과해야 함
  expect(duration).toBeLessThan(30000); // 30초 이내
  expect(aiResult.passed).toBe(true);
});
```

## 팁과 트릭

### 1. 테스트 속도 향상

```typescript
// 병렬 실행 활성화 (playwright.config.ts)
fullyParallel: true,
workers: 4,
```

### 2. 실패한 테스트만 재실행

```bash
npx playwright test --last-failed
```

### 3. 특정 태그의 테스트만 실행

```typescript
test('중요한 기능', { tag: '@critical' }, async ({ page }) => {
  // ...
});
```

```bash
npx playwright test --grep @critical
```

### 4. AI 분석 결과 캐싱

동일한 화면을 여러 번 분석하지 않도록:

```typescript
const cache = new Map();

async function analyzeWithCache(page, key, expectedBehavior) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await analyzePageWithAI(page, expectedBehavior);
  cache.set(key, result);
  return result;
}
```

## 문제 해결

### Q: AI 분석이 너무 오래 걸립니다
**A:** 타임아웃을 늘리거나, 이미지 해상도를 낮추세요:
```typescript
await page.screenshot({ 
  fullPage: true,
  scale: 'css' // 'device' 대신 'css'
});
```

### Q: 테스트가 불안정합니다 (flaky)
**A:** 적절한 대기 시간 추가:
```typescript
await waitForPageLoad(page);
await stabilizeForScreenshot(page);
```

### Q: OpenAI API 비용이 걱정됩니다
**A:** 
- `detail: 'low'` 옵션 사용
- 중요한 테스트에만 AI 분석 적용
- 로컬에서는 일반 테스트만, CI/CD에서 AI 테스트 실행

## 다음 단계

1. ✅ 이 가이드를 따라 첫 테스트 실행
2. ✅ 주요 사용자 플로우에 AI 테스트 추가
3. ✅ CI/CD 파이프라인에 통합
4. ✅ 팀과 테스트 결과 공유
5. ✅ 지속적으로 테스트 케이스 확장

## 도움이 필요하신가요?

- 📖 [테스트 README](./tests/README.md)
- 🎭 [Playwright 공식 문서](https://playwright.dev/)
- 🤖 [OpenAI API 문서](https://platform.openai.com/docs/)

Happy Testing! 🎉
