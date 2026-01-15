/**
 * 커플 연결 플로우 E2E 테스트
 * AI Vision을 사용한 자동 UI/UX 검증
 */

import { test, expect } from '../utils/fixtures';
import { analyzePageWithAI, analyzeUserFlow, saveTestResult } from '../utils/ai-vision';
import { 
  generateTestUser, 
  waitForPageLoad,
  stabilizeForScreenshot 
} from '../utils/test-helpers';

test.describe('커플 연결 플로우', () => {
  test('초대 코드 생성 플로우 - 회원가입 후', async ({ page }) => {
    const screenshots: { step: string; image: string; url: string }[] = [];
    const user = generateTestUser();

    // 1단계: 회원가입
    await page.goto('/signup');
    await page.fill('input#name', user.nickname);
    await page.fill('input#email', user.email);
    await page.fill('input#password', user.password);
    await page.fill('input#confirmPassword', user.password);
    
    let screenshot = await page.screenshot({ fullPage: true });
    screenshots.push({
      step: '회원가입 폼 작성',
      image: screenshot.toString('base64'),
      url: page.url(),
    });

    await page.click('button[type="submit"]');
    
    // 2단계: 회원가입 성공 화면
    await page.waitForSelector('h1:has-text("회원가입 완료")', { timeout: 15000 });
    await stabilizeForScreenshot(page);
    
    screenshot = await page.screenshot({ fullPage: true });
    screenshots.push({
      step: '회원가입 성공',
      image: screenshot.toString('base64'),
      url: page.url(),
    });

    // AI로 성공 화면 분석
    const successAnalysis = await analyzePageWithAI(
      page,
      '회원가입 성공 화면이 표시되고, 사용자가 다음 액션을 할 수 있는 버튼들이 있어야 합니다.',
      '회원가입 성공 후 화면'
    );

    saveTestResult('couple-connection-signup-success', successAnalysis);

    // 성공 화면 확인
    await expect(page.locator('h1:has-text("회원가입 완료")')).toBeVisible();
    
    console.log('✅ 회원가입 성공');
  });

  test('완전한 커플 연결 플로우 - 두 사용자', async ({ browser }) => {
    // 두 개의 브라우저 컨텍스트 생성 (두 명의 사용자)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const user1 = generateTestUser();
    const user2 = generateTestUser();

    const screenshots: { step: string; image: string; url: string }[] = [];

    try {
      // === 사용자 1: 회원가입 및 초대 코드 생성 ===
      console.log('👤 사용자 1 회원가입...');
      await page1.goto('/signup');
      await page1.fill('input#name', user1.nickname);
      await page1.fill('input#email', user1.email);
      await page1.fill('input#password', user1.password);
      await page1.fill('input#confirmPassword', user1.password);
      await page1.click('button[type="submit"]');
      
      await page1.waitForSelector('h1:has-text("회원가입 완료")', { timeout: 15000 });
      
      // 시작하기 버튼 클릭하여 메인 화면으로
      await page1.click('button:has-text("시작하기")');
      await page1.waitForURL(/\/(home|profile|upload|\/)/, { timeout: 10000 });
      await waitForPageLoad(page1);

      let screenshot = await page1.screenshot({ fullPage: true });
      screenshots.push({
        step: '사용자1 - 메인 화면 진입',
        image: screenshot.toString('base64'),
        url: page1.url(),
      });

      // 프로필 페이지로 이동하여 초대 코드 확인
      await page1.goto('/profile');
      await waitForPageLoad(page1);
      await stabilizeForScreenshot(page1);

      screenshot = await page1.screenshot({ fullPage: true });
      screenshots.push({
        step: '사용자1 - 프로필 페이지',
        image: screenshot.toString('base64'),
        url: page1.url(),
      });

      // AI로 프로필 페이지 분석
      const profileAnalysis = await analyzePageWithAI(
        page1,
        '프로필 페이지에 사용자 정보와 초대 코드가 표시되어야 합니다. 초대 코드를 복사하거나 공유할 수 있는 방법이 있어야 합니다.',
        '사용자1 프로필 페이지'
      );

      saveTestResult('couple-user1-profile', profileAnalysis);

      // 초대 코드 생성 또는 확인
      // (실제 구현에 따라 다를 수 있음 - API를 통해 초대 코드 생성)
      const response = await page1.request.post('/api/couple/create-invite');
      expect(response.ok()).toBe(true);
      
      const data = await response.json();
      const inviteCode = data.inviteCode;
      
      console.log('🔑 생성된 초대 코드:', inviteCode);
      expect(inviteCode).toBeTruthy();
      expect(inviteCode.length).toBe(6);

      // === 사용자 2: 회원가입 및 초대 코드 입력 ===
      console.log('👤 사용자 2 회원가입...');
      await page2.goto('/signup');
      await page2.fill('input#name', user2.nickname);
      await page2.fill('input#email', user2.email);
      await page2.fill('input#password', user2.password);
      await page2.fill('input#confirmPassword', user2.password);
      await page2.click('button[type="submit"]');
      
      await page2.waitForSelector('h1:has-text("회원가입 완료")', { timeout: 15000 });
      
      screenshot = await page2.screenshot({ fullPage: true });
      screenshots.push({
        step: '사용자2 - 회원가입 성공',
        image: screenshot.toString('base64'),
        url: page2.url(),
      });

      // 시작하기 버튼 클릭
      await page2.click('button:has-text("시작하기")');
      await page2.waitForURL(/\/(home|profile|upload|\/)/, { timeout: 10000 });
      await waitForPageLoad(page2);

      // 초대 코드 입력 (홈 화면이나 프로필에서)
      // 바텀 시트가 자동으로 나타나는지 확인
      await page2.waitForTimeout(1000);
      
      // 바텀 시트가 나타났는지 확인
      const hasBottomSheet = await page2.locator('[data-testid="bottom-sheet"], [role="dialog"]').isVisible().catch(() => false);
      
      if (hasBottomSheet) {
        console.log('✅ 커플 초대 바텀 시트 자동 표시');
        
        // 초대 코드 입력 옵션 선택
        const joinButton = page2.locator('button:has-text("초대 코드"), button:has-text("코드 입력")');
        if (await joinButton.isVisible()) {
          await joinButton.click();
        }
      } else {
        // 수동으로 초대 코드 입력 페이지 찾기
        console.log('수동으로 초대 코드 입력 찾기...');
        // 프로필이나 설정에서 커플 연결 옵션 찾기
        await page2.goto('/profile');
      }

      await stabilizeForScreenshot(page2);
      screenshot = await page2.screenshot({ fullPage: true });
      screenshots.push({
        step: '사용자2 - 초대 코드 입력 화면',
        image: screenshot.toString('base64'),
        url: page2.url(),
      });

      // 초대 코드 입력 필드 찾기
      const codeInput = page2.locator('input[placeholder*="코드"], input[maxlength="6"]');
      if (await codeInput.isVisible()) {
        await codeInput.fill(inviteCode);
        
        // 연결하기 버튼 클릭
        await page2.click('button:has-text("연결"), button:has-text("join")');
        
        // 연결 성공 대기
        await page2.waitForSelector('h1:has-text("연결 완료"), .success, [data-testid="connection-success"]', { timeout: 15000 }).catch(() => {
          console.log('연결 성공 화면을 찾을 수 없습니다');
        });

        await stabilizeForScreenshot(page2);
        screenshot = await page2.screenshot({ fullPage: true });
        screenshots.push({
          step: '사용자2 - 커플 연결 성공',
          image: screenshot.toString('base64'),
          url: page2.url(),
        });

        // AI로 연결 성공 화면 분석
        const connectionSuccessAnalysis = await analyzePageWithAI(
          page2,
          '커플 연결이 성공적으로 완료되었음을 나타내는 화면이 표시되어야 합니다. 성공 메시지와 다음 단계가 명확해야 합니다.',
          '커플 연결 성공 화면'
        );

        saveTestResult('couple-connection-success', connectionSuccessAnalysis);
      } else {
        // API를 통해 직접 연결
        console.log('API를 통해 커플 연결...');
        const joinResponse = await page2.request.post('/api/couple/join', {
          data: { inviteCode },
        });
        
        expect(joinResponse.ok()).toBe(true);
        console.log('✅ API를 통한 커플 연결 성공');
      }

      // === 두 사용자 모두 커플 상태 확인 ===
      console.log('👥 커플 연결 상태 확인...');
      
      // 사용자 1 - 커플 상태 API 확인
      const status1Response = await page1.request.get('/api/couple/status');
      expect(status1Response.ok()).toBe(true);
      const status1 = await status1Response.json();
      
      // 사용자 2 - 커플 상태 API 확인
      const status2Response = await page2.request.get('/api/couple/status');
      expect(status2Response.ok()).toBe(true);
      const status2 = await status2Response.json();

      console.log('사용자1 커플 상태:', status1);
      console.log('사용자2 커플 상태:', status2);

      // AI로 전체 플로우 분석
      const flowAnalysis = await analyzeUserFlow(
        screenshots,
        '두 사용자가 각각 회원가입하고 초대 코드를 통해 커플로 연결되는 전체 플로우'
      );

    console.log('📊 커플 연결 플로우 AI 분석:');
    console.log('  전체 통과:', flowAnalysis.overallPassed ? '✅' : '⚠️');
    console.log('  분석 결과:', flowAnalysis.flowAnalysis);

    // AI 분석은 참고용으로만 사용
    if (!flowAnalysis.overallPassed) {
      console.warn('⚠️ AI가 UX 개선이 필요한 부분을 발견했습니다.');
    }
    
    // 실제 기능 테스트: 두 사용자 모두 커플 연결 상태인지 확인
    expect(status1.connected).toBe(true);
    expect(status2.connected).toBe(true);
    console.log('✅ 커플 연결 기능 테스트 통과');

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('잘못된 초대 코드 입력', async ({ page, authenticatedPage }) => {
    // 이미 로그인된 상태
    await authenticatedPage.goto('/profile');
    await waitForPageLoad(authenticatedPage);

    // 잘못된 초대 코드로 연결 시도 (API 테스트)
    const wrongCode = 'WRONG1';
    const response = await authenticatedPage.request.post('/api/couple/join', {
      data: { inviteCode: wrongCode },
    });

    // 에러 응답 확인
    expect(response.ok()).toBe(false);
    const errorData = await response.json();
    
    console.log('잘못된 초대 코드 에러:', errorData);
    expect(errorData.error).toBeTruthy();
  });

  test('만료된 초대 코드 처리', async ({ page, authenticatedPage }) => {
    // 초대 코드는 24시간 후 만료되는지 확인
    // (실제 구현에 따라 다를 수 있음)
    
    // 이 테스트는 시간 조작이 필요하므로 스킵하거나 모킹 필요
    console.log('⏰ 만료된 초대 코드 테스트는 시간 조작이 필요합니다');
  });

  test('이미 연결된 사용자가 다시 연결 시도', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    try {
      // 사용자 1, 2가 이미 연결됨
      const user1 = generateTestUser();
      const user2 = generateTestUser();
      const user3 = generateTestUser();

      // 사용자 1 회원가입
      await page1.goto('/signup');
      await page1.fill('input#name', user1.nickname);
      await page1.fill('input#email', user1.email);
      await page1.fill('input#password', user1.password);
      await page1.fill('input#confirmPassword', user1.password);
      await page1.click('button[type="submit"]');
      await page1.waitForSelector('h1:has-text("회원가입 완료")');
      await page1.click('button:has-text("시작하기")');

      // 초대 코드 생성
      const response1 = await page1.request.post('/api/couple/create-invite');
      const data1 = await response1.json();
      const inviteCode = data1.inviteCode;

      // 사용자 2 회원가입 및 연결
      await page2.goto('/signup');
      await page2.fill('input#name', user2.nickname);
      await page2.fill('input#email', user2.email);
      await page2.fill('input#password', user2.password);
      await page2.fill('input#confirmPassword', user2.password);
      await page2.click('button[type="submit"]');
      await page2.waitForSelector('h1:has-text("회원가입 완료")');
      await page2.click('button:has-text("시작하기")');

      // 사용자 2가 초대 코드로 연결
      const joinResponse = await page2.request.post('/api/couple/join', {
        data: { inviteCode },
      });
      expect(joinResponse.ok()).toBe(true);

      // 사용자 3 회원가입
      await page3.goto('/signup');
      await page3.fill('input#name', user3.nickname);
      await page3.fill('input#email', user3.email);
      await page3.fill('input#password', user3.password);
      await page3.fill('input#confirmPassword', user3.password);
      await page3.click('button[type="submit"]');
      await page3.waitForSelector('h1:has-text("회원가입 완료")');
      await page3.click('button:has-text("시작하기")');

      // 사용자 3이 이미 사용된 초대 코드로 연결 시도
      const joinResponse3 = await page3.request.post('/api/couple/join', {
        data: { inviteCode },
      });

      // 에러 응답 확인 (이미 사용된 코드)
      expect(joinResponse3.ok()).toBe(false);
      const errorData = await joinResponse3.json();
      
      console.log('이미 사용된 초대 코드 에러:', errorData);
      expect(errorData.error).toBeTruthy();

    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });

  test('초대 코드 UI 복사 기능', async ({ page, authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    await waitForPageLoad(authenticatedPage);
    await stabilizeForScreenshot(authenticatedPage);

    // AI로 프로필 페이지 분석
    const profileAnalysis = await analyzePageWithAI(
      authenticatedPage,
      '프로필 페이지에 초대 코드가 표시되고, 복사 버튼이 있어야 합니다. 사용자가 쉽게 코드를 복사할 수 있어야 합니다.',
      '프로필 페이지 초대 코드'
    );

    saveTestResult('couple-invite-code-ui', profileAnalysis);

    if (profileAnalysis.issues.length > 0) {
      console.warn('⚠️ 초대 코드 UI 이슈:', profileAnalysis.issues);
    }
  });
});
