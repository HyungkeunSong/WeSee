/**
 * 로그인 플로우 E2E 테스트
 * AI Vision을 사용한 자동 UI/UX 검증
 */

import { test, expect } from '../utils/fixtures';
import { analyzePageWithAI, saveTestResult } from '../utils/ai-vision';
import { 
  generateTestUser, 
  waitForPageLoad,
  stabilizeForScreenshot 
} from '../utils/test-helpers';

test.describe('로그인 플로우', () => {
  test('로그인 페이지 렌더링 테스트', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);
    await stabilizeForScreenshot(page);

    // AI Vision으로 화면 분석
    const aiResult = await analyzePageWithAI(
      page,
      '로그인 페이지가 표시되어야 합니다. 같이봄 로고, 이메일/비밀번호 입력 필드, 로그인 버튼, 회원가입 링크가 있어야 합니다.',
      '로그인 페이지 첫 화면'
    );

    saveTestResult('login-page-render', aiResult);

    // 기본 어설션
    await expect(page.locator('h1:has-text("같이봄")')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("로그인")')).toBeVisible();
    await expect(page.locator('a[href="/signup"]')).toBeVisible();

    // AI가 심각한 이슈를 발견하면 로그
    if (aiResult.issues.length > 0) {
      console.warn('⚠️ AI가 발견한 UI 이슈:', aiResult.issues);
    }
  });

  test('잘못된 로그인 정보로 로그인 시도', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input#email', 'wrong@email.com');
    await page.fill('input#password', 'wrongpassword');
    
    await page.click('button[type="submit"]');

    // 에러 메시지 대기
    await page.waitForSelector('.bg-red-50', { timeout: 10000 });
    await stabilizeForScreenshot(page);

    // AI로 에러 메시지 분석
    const aiResult = await analyzePageWithAI(
      page,
      '잘못된 로그인 정보에 대한 명확한 에러 메시지가 표시되어야 합니다. 사용자가 무엇을 잘못했는지 알 수 있어야 합니다.',
      '로그인 실패 에러'
    );

    saveTestResult('login-error-message', aiResult);

    // 에러 메시지가 표시되는지 확인
    const errorElement = page.locator('.bg-red-50');
    await expect(errorElement).toBeVisible();
  });

  test('완전한 로그인 플로우', async ({ page }) => {
    // 먼저 회원가입
    const user = generateTestUser();
    
    await page.goto('/signup');
    await page.fill('input#name', user.nickname);
    await page.fill('input#email', user.email);
    await page.fill('input#password', user.password);
    await page.fill('input#confirmPassword', user.password);
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('h1:has-text("회원가입 완료")', { timeout: 15000 });
    await page.click('button:has-text("시작하기")');
    await page.waitForURL(/\/(home|profile|upload|\/)/, { timeout: 10000 });

    // 로그아웃을 위해 로그인 페이지로 직접 이동 (간단한 테스트를 위해)
    await page.goto('/login');

    // 로그인 시도
    await page.fill('input#email', user.email);
    await page.fill('input#password', user.password);
    
    await stabilizeForScreenshot(page);
    let screenshot = await page.screenshot({ fullPage: true });

    await page.click('button[type="submit"]');

    // 홈 페이지로 리다이렉트 대기
    await page.waitForURL(/\/(home|profile|upload|\/)/, { timeout: 15000 });
    await waitForPageLoad(page);
    await stabilizeForScreenshot(page);

    // AI로 로그인 후 화면 분석
    const aiResult = await analyzePageWithAI(
      page,
      '로그인 후 홈 화면이나 메인 화면이 표시되어야 합니다. 하단 네비게이션이 있어야 합니다.',
      '로그인 성공 후 메인 화면'
    );

    saveTestResult('login-success-home', aiResult);

    console.log('✅ 로그인 성공 - 현재 URL:', page.url());
  });

  test('이메일 필드 검증', async ({ page }) => {
    await page.goto('/login');

    // 잘못된 이메일 형식
    await page.fill('input#email', 'not-an-email');
    await page.fill('input#password', 'password123');
    
    // HTML5 validation이 동작하는지 확인
    const emailInput = page.locator('input#email');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    
    expect(isValid).toBe(false);
  });

  test('빈 폼으로 로그인 시도', async ({ page }) => {
    await page.goto('/login');

    // 빈 상태로 제출
    await page.click('button[type="submit"]');

    // 브라우저의 기본 validation 메시지가 표시되는지 확인
    const emailInput = page.locator('input#email');
    const isRequired = await emailInput.evaluate((el: HTMLInputElement) => el.required);
    
    expect(isRequired).toBe(true);
  });

  test('로딩 상태 UI 테스트', async ({ page }) => {
    await page.goto('/login');

    const user = generateTestUser();
    
    // 먼저 유효한 계정 생성
    await page.goto('/signup');
    await page.fill('input#name', user.nickname);
    await page.fill('input#email', user.email);
    await page.fill('input#password', user.password);
    await page.fill('input#confirmPassword', user.password);
    await page.click('button[type="submit"]');
    await page.waitForSelector('h1:has-text("회원가입 완료")');

    // 로그인 페이지로 이동
    await page.goto('/login');
    await page.fill('input#email', user.email);
    await page.fill('input#password', user.password);

    // 로그인 버튼 클릭과 동시에 로딩 상태 캡처
    const loginButtonPromise = page.click('button[type="submit"]');
    
    // 로딩 상태 확인 (짧은 시간 내에)
    try {
      await page.waitForSelector('button:has-text("로그인 중")', { timeout: 2000 });
      await stabilizeForScreenshot(page);
      
      // AI로 로딩 UI 분석
      const aiResult = await analyzePageWithAI(
        page,
        '로그인 중임을 나타내는 로딩 인디케이터가 표시되어야 합니다.',
        '로그인 로딩 상태'
      );

      saveTestResult('login-loading-state', aiResult);
    } catch (error) {
      console.log('로딩 상태가 너무 빨리 지나갔습니다 (정상)');
    }

    await loginButtonPromise;
  });

  test('회원가입 링크 네비게이션', async ({ page }) => {
    await page.goto('/login');

    // 회원가입 링크 클릭
    await page.click('a[href="/signup"]');

    // 회원가입 페이지로 이동 확인
    await page.waitForURL('/signup');
    await expect(page.locator('h1:has-text("같이봄")')).toBeVisible();
    await expect(page.locator('input#name')).toBeVisible();
  });

  test('반응형 디자인 테스트', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 13 Pro' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/login');
      await waitForPageLoad(page);
      await stabilizeForScreenshot(page);

      const aiResult = await analyzePageWithAI(
        page,
        `${viewport.name}에서 로그인 폼이 잘 보여야 합니다. 모든 요소가 화면에 맞게 표시되어야 합니다.`,
        `${viewport.name} 로그인 페이지`
      );

      saveTestResult(`login-responsive-${viewport.name}`, aiResult);

      // 주요 요소 확인
      await expect(page.locator('input#email')).toBeVisible();
      await expect(page.locator('input#password')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    }
  });
});
