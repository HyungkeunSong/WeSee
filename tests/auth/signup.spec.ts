/**
 * 회원가입 플로우 E2E 테스트
 * AI Vision을 사용한 자동 UI/UX 검증
 */

import { test, expect } from '../utils/fixtures';
import { analyzePageWithAI, saveTestResult } from '../utils/ai-vision';
import { 
  generateTestUser, 
  waitForPageLoad, 
  expectToast,
  stabilizeForScreenshot 
} from '../utils/test-helpers';

test.describe('회원가입 플로우', () => {
  test('회원가입 페이지 렌더링 테스트', async ({ page }) => {
    await page.goto('/signup');
    await waitForPageLoad(page);
    await stabilizeForScreenshot(page);

    // AI Vision으로 화면 분석
    const aiResult = await analyzePageWithAI(
      page,
      '회원가입 페이지가 표시되어야 합니다. 같이봄 로고, 이름/이메일/비밀번호 입력 필드, 회원가입 버튼, 로그인 링크가 있어야 합니다.',
      '회원가입 페이지 첫 화면'
    );

    // AI 분석 결과 저장
    saveTestResult('signup-page-render', aiResult);

    // AI가 발견한 이슈 확인
    if (aiResult.issues.length > 0) {
      console.warn('⚠️ AI가 발견한 UI 이슈:', aiResult.issues);
    }

    // 기본 어설션
    await expect(page.locator('h1:has-text("같이봄")')).toBeVisible();
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("회원가입")')).toBeVisible();

    // AI가 심각한 이슈를 발견하면 테스트 실패
    const criticalIssues = aiResult.issues.filter(issue => 
      issue.includes('누락') || issue.includes('표시되지 않') || issue.includes('심각')
    );
    expect(criticalIssues.length).toBe(0);
  });

  test('유효성 검증 - 비밀번호 불일치', async ({ page }) => {
    await page.goto('/signup');
    
    const user = generateTestUser();
    
    // 폼 작성 (비밀번호 불일치)
    await page.fill('input#name', user.nickname);
    await page.fill('input#email', user.email);
    await page.fill('input#password', user.password);
    await page.fill('input#confirmPassword', user.password + 'wrong');
    
    // 회원가입 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('.bg-red-50:has-text("비밀번호가 일치하지 않습니다")')).toBeVisible();

    // AI로 에러 메시지 UI 검증
    await stabilizeForScreenshot(page);
    const aiResult = await analyzePageWithAI(
      page,
      '비밀번호 불일치 에러 메시지가 명확하게 표시되어야 합니다. 사용자가 쉽게 이해할 수 있어야 합니다.',
      '비밀번호 불일치 에러 상태'
    );

    saveTestResult('signup-password-mismatch', aiResult);
  });

  test('유효성 검증 - 짧은 비밀번호', async ({ page }) => {
    await page.goto('/signup');
    
    const user = generateTestUser();
    
    await page.fill('input#name', user.nickname);
    await page.fill('input#email', user.email);
    await page.fill('input#password', '12345'); // 6자 미만
    await page.fill('input#confirmPassword', '12345');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.bg-red-50:has-text("최소 6자")')).toBeVisible();
  });

  test('완전한 회원가입 플로우 - AI 분석 포함', async ({ page }) => {
    const screenshots: { step: string; image: string; url: string }[] = [];
    const user = generateTestUser();

    // 1단계: 회원가입 페이지
    await page.goto('/signup');
    await waitForPageLoad(page);
    await stabilizeForScreenshot(page);
    
    let screenshot = await page.screenshot({ fullPage: true });
    screenshots.push({
      step: '회원가입 페이지 진입',
      image: screenshot.toString('base64'),
      url: page.url(),
    });

    // 2단계: 폼 작성
    await page.fill('input#name', user.nickname);
    await page.fill('input#email', user.email);
    await page.fill('input#password', user.password);
    await page.fill('input#confirmPassword', user.password);
    
    await stabilizeForScreenshot(page);
    screenshot = await page.screenshot({ fullPage: true });
    screenshots.push({
      step: '회원가입 폼 작성 완료',
      image: screenshot.toString('base64'),
      url: page.url(),
    });

    // 3단계: 회원가입 제출
    await page.click('button[type="submit"]');
    
    // 성공 화면 대기
    await page.waitForSelector('h1:has-text("회원가입 완료")', { timeout: 15000 });
    await stabilizeForScreenshot(page);
    
    screenshot = await page.screenshot({ fullPage: true });
    screenshots.push({
      step: '회원가입 성공 화면',
      image: screenshot.toString('base64'),
      url: page.url(),
    });

    // AI로 성공 화면 분석
    const successAnalysis = await analyzePageWithAI(
      page,
      '회원가입 성공 메시지와 시작하기 버튼이 명확하게 표시되어야 합니다. 사용자에게 다음 단계를 안내해야 합니다.',
      '회원가입 성공 화면'
    );

    saveTestResult('signup-success-screen', successAnalysis);

    // 성공 화면 요소 확인
    await expect(page.locator('h1:has-text("회원가입 완료")')).toBeVisible();
    await expect(page.locator('button:has-text("시작하기")')).toBeVisible();

    // 4단계: 시작하기 클릭
    await page.click('button:has-text("시작하기")');
    
    // 홈 또는 프로필 페이지로 리다이렉트 대기
    await page.waitForURL(/\/(home|profile|upload|\/)/, { timeout: 10000 });
    await stabilizeForScreenshot(page);
    
    screenshot = await page.screenshot({ fullPage: true });
    screenshots.push({
      step: '앱 메인 화면',
      image: screenshot.toString('base64'),
      url: page.url(),
    });

    // AI로 전체 플로우 분석
    const { analyzeUserFlow } = await import('../utils/ai-vision');
    const flowAnalysis = await analyzeUserFlow(
      screenshots,
      '사용자가 회원가입부터 앱 사용까지 자연스럽게 진행되는 플로우'
    );

    console.log('📊 회원가입 플로우 AI 분석:');
    console.log('  전체 통과:', flowAnalysis.overallPassed ? '✅' : '⚠️');
    console.log('  분석 결과:', flowAnalysis.flowAnalysis);
    
    if (flowAnalysis.stepResults.length > 0) {
      console.log('  단계별 이슈:');
      flowAnalysis.stepResults.forEach(result => {
        if (result.issues.length > 0) {
          console.log(`    - ${result.step}:`, result.issues);
        }
      });
    }

    // AI 분석은 참고용으로만 사용 (경고만 출력)
    if (!flowAnalysis.overallPassed) {
      console.warn('⚠️ AI가 UX 개선이 필요한 부분을 발견했습니다. 위 분석 결과를 참고하세요.');
    }
    
    // 실제 기능 테스트: 회원가입 후 메인 화면에 도달했는지만 확인
    expect(page.url()).toMatch(/\/(home|profile|upload|\/)/);
    console.log('✅ 회원가입 플로우 기능 테스트 통과');
  });

  test('모바일 반응형 테스트', async ({ page }) => {
    // 다양한 뷰포트 크기로 테스트
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 13 Pro' },
      { width: 360, height: 740, name: 'Samsung Galaxy S21' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/signup');
      await waitForPageLoad(page);
      await stabilizeForScreenshot(page);

      const aiResult = await analyzePageWithAI(
        page,
        `${viewport.name} 크기에서 모든 요소가 잘 보이고 터치하기 쉬워야 합니다. 레이아웃이 깨지지 않아야 합니다.`,
        `${viewport.name} 반응형 테스트`
      );

      saveTestResult(`signup-responsive-${viewport.name}`, aiResult);

      // 주요 요소가 보이는지 확인
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // AI가 반응형 이슈를 발견하면 경고
      if (aiResult.issues.length > 0) {
        console.warn(`⚠️ ${viewport.name} 반응형 이슈:`, aiResult.issues);
      }
    }
  });

  test('접근성 검증', async ({ page }) => {
    await page.goto('/signup');
    await waitForPageLoad(page);

    // AI로 접근성 분석
    const { analyzeAccessibility } = await import('../utils/ai-vision');
    const accessibilityResult = await analyzeAccessibility(page);

    console.log('♿ 접근성 분석 결과:');
    console.log('  점수:', accessibilityResult.score, '/100');
    console.log('  이슈:', accessibilityResult.issues);
    console.log('  권장사항:', accessibilityResult.recommendations);

    // 기본 접근성 확인
    // 폼 레이블 확인
    const nameLabel = await page.locator('label[for="name"]');
    const emailLabel = await page.locator('label[for="email"]');
    const passwordLabel = await page.locator('label[for="password"]');
    
    await expect(nameLabel).toBeVisible();
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();

    // 접근성 점수가 너무 낮으면 경고
    if (accessibilityResult.score < 70) {
      console.warn('⚠️ 접근성 점수가 낮습니다:', accessibilityResult.score);
    }
  });

  test('중복 회원가입 시도', async ({ page, testUser }) => {
    // 첫 번째 회원가입
    await page.goto('/signup');
    await page.fill('input#name', testUser.nickname);
    await page.fill('input#email', testUser.email);
    await page.fill('input#password', testUser.password);
    await page.fill('input#confirmPassword', testUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('h1:has-text("회원가입 완료")', { timeout: 15000 });

    // 로그아웃 또는 새 브라우저 컨텍스트
    await page.goto('/signup');
    
    // 동일한 이메일로 다시 회원가입 시도
    await page.fill('input#name', testUser.nickname + '2');
    await page.fill('input#email', testUser.email); // 동일한 이메일
    await page.fill('input#password', testUser.password);
    await page.fill('input#confirmPassword', testUser.password);
    await page.click('button[type="submit"]');

    // 에러 메시지 확인
    await page.waitForSelector('.bg-red-50', { timeout: 5000 });
    const errorMessage = await page.locator('.bg-red-50').textContent();
    
    console.log('중복 가입 에러 메시지:', errorMessage);
    
    // AI로 에러 메시지가 적절한지 분석
    await stabilizeForScreenshot(page);
    const aiResult = await analyzePageWithAI(
      page,
      '중복된 이메일에 대한 명확한 에러 메시지가 표시되어야 합니다.',
      '중복 회원가입 에러'
    );

    saveTestResult('signup-duplicate-email', aiResult);
  });
});
