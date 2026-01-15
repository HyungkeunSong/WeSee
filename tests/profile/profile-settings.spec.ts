/**
 * 프로필 및 설정 E2E 테스트
 * AI Vision을 사용한 자동 UI/UX 검증
 */

import { test, expect } from '../utils/fixtures';
import { analyzePageWithAI, saveTestResult, analyzeAccessibility } from '../utils/ai-vision';
import { 
  waitForPageLoad,
  stabilizeForScreenshot,
  logout
} from '../utils/test-helpers';

test.describe('프로필 및 설정', () => {
  test('프로필 페이지 렌더링 테스트', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    await waitForPageLoad(authenticatedPage);
    await stabilizeForScreenshot(authenticatedPage);

    // AI Vision으로 화면 분석
    const aiResult = await analyzePageWithAI(
      authenticatedPage,
      '프로필 페이지가 표시되어야 합니다. 사용자 이름, 이메일, 프로필 사진, 설정 옵션들이 있어야 합니다.',
      '프로필 페이지'
    );

    saveTestResult('profile-page-render', aiResult);

    console.log('👤 프로필 페이지 AI 분석:');
    console.log('  통과:', aiResult.passed ? '✅' : '❌');
    console.log('  이슈:', aiResult.issues);
    console.log('  제안:', aiResult.suggestions);

    if (aiResult.issues.length > 0) {
      console.warn('⚠️ 프로필 페이지 이슈:', aiResult.issues);
    }
  });

  test('프로필 정보 표시 확인', async ({ authenticatedPage, testUser }) => {
    await authenticatedPage.goto('/profile');
    await waitForPageLoad(authenticatedPage);

    // 사용자 정보가 표시되는지 확인
    const nameElement = authenticatedPage.locator(`text=${testUser.nickname}, text=${testUser.email}`);
    const isVisible = await nameElement.first().isVisible().catch(() => false);

    if (isVisible) {
      console.log('✅ 사용자 정보 표시 확인');
    }

    await stabilizeForScreenshot(authenticatedPage);

    // AI로 정보 표시 품질 확인
    const infoDisplayAnalysis = await analyzePageWithAI(
      authenticatedPage,
      '사용자의 이름과 이메일이 명확하게 표시되어야 합니다. 프로필 이미지 영역도 있어야 합니다.',
      '프로필 정보 표시'
    );

    saveTestResult('profile-info-display', infoDisplayAnalysis);
  });

  test('프로필 사진 업로드', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    await waitForPageLoad(authenticatedPage);

    // 프로필 사진 업로드 버튼 찾기
    const uploadButton = authenticatedPage.locator('button:has-text("사진"), button:has-text("이미지"), input[type="file"]');
    
    if (await uploadButton.first().isVisible()) {
      console.log('✅ 프로필 사진 업로드 기능 있음');

      await stabilizeForScreenshot(authenticatedPage);
      const uploadUIAnalysis = await analyzePageWithAI(
        authenticatedPage,
        '프로필 사진을 업로드하거나 변경할 수 있는 명확한 방법이 있어야 합니다.',
        '프로필 사진 업로드 UI'
      );

      saveTestResult('profile-photo-upload-ui', uploadUIAnalysis);
    } else {
      console.log('ℹ️ 프로필 사진 업로드 UI를 찾을 수 없음');
    }
  });

  test('설정 페이지 접근', async ({ authenticatedPage }) => {
    // 프로필에서 설정으로 이동
    await authenticatedPage.goto('/profile');
    await waitForPageLoad(authenticatedPage);

    // 설정 버튼 찾기
    const settingsLink = authenticatedPage.locator('a[href="/settings"], button:has-text("설정")');
    
    if (await settingsLink.first().isVisible()) {
      await settingsLink.first().click();
      await waitForPageLoad(authenticatedPage);
      await stabilizeForScreenshot(authenticatedPage);

      // AI로 설정 페이지 분석
      const settingsAnalysis = await analyzePageWithAI(
        authenticatedPage,
        '설정 페이지에는 다양한 설정 옵션들이 잘 정리되어 표시되어야 합니다. 카테고리별로 구분되어 있어야 합니다.',
        '설정 페이지'
      );

      saveTestResult('settings-page', settingsAnalysis);
    } else {
      // 직접 설정 페이지로 이동
      await authenticatedPage.goto('/settings');
      await waitForPageLoad(authenticatedPage);
      await stabilizeForScreenshot(authenticatedPage);

      const settingsAnalysis = await analyzePageWithAI(
        authenticatedPage,
        '설정 페이지가 표시되어야 합니다.',
        '설정 페이지 (직접 접근)'
      );

      saveTestResult('settings-page-direct', settingsAnalysis);
    }
  });

  test('다크모드 토글 (있는 경우)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForPageLoad(authenticatedPage);

    // 다크모드 토글 찾기
    const darkModeToggle = authenticatedPage.locator('button:has-text("다크"), input[type="checkbox"]:has-text("다크")');
    
    if (await darkModeToggle.first().isVisible()) {
      console.log('🌙 다크모드 토글 발견');

      // Before 스크린샷
      await stabilizeForScreenshot(authenticatedPage);
      const beforeScreenshot = await authenticatedPage.screenshot({ fullPage: true });

      // 토글 클릭
      await darkModeToggle.first().click();
      await authenticatedPage.waitForTimeout(500);

      // After 스크린샷
      await stabilizeForScreenshot(authenticatedPage);
      const afterScreenshot = await authenticatedPage.screenshot({ fullPage: true });

      // AI로 두 화면 비교
      const { compareScreenshotsWithAI } = await import('../utils/ai-vision');
      const comparison = await compareScreenshotsWithAI(
        beforeScreenshot.toString('base64'),
        afterScreenshot.toString('base64'),
        '다크모드 토글 전후 비교'
      );

      console.log('🔍 다크모드 비교 결과:');
      console.log('  유사도:', comparison.similarity, '%');
      console.log('  차이점:', comparison.differences);
      console.log('  통과:', comparison.passed ? '✅' : '❌');

      // 차이가 있어야 함 (다크모드가 적용되었으므로)
      expect(comparison.similarity).toBeLessThan(95);
    } else {
      console.log('ℹ️ 다크모드 토글 없음');
    }
  });

  test('알림 설정', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForPageLoad(authenticatedPage);

    // 알림 설정 찾기
    const notificationSettings = authenticatedPage.locator('text=알림, text=notification');
    
    if (await notificationSettings.first().isVisible()) {
      console.log('🔔 알림 설정 발견');

      await stabilizeForScreenshot(authenticatedPage);
      const notifAnalysis = await analyzePageWithAI(
        authenticatedPage,
        '알림 설정이 명확하게 표시되고 쉽게 조작할 수 있어야 합니다.',
        '알림 설정'
      );

      saveTestResult('notification-settings', notifAnalysis);
    } else {
      console.log('ℹ️ 알림 설정 없음');
    }
  });

  test('언어 설정 (있는 경우)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForPageLoad(authenticatedPage);

    // 언어 설정 찾기
    const languageSettings = authenticatedPage.locator('text=언어, text=Language');
    
    if (await languageSettings.first().isVisible()) {
      console.log('🌐 언어 설정 발견');
      // 언어 설정 UI 테스트
    } else {
      console.log('ℹ️ 언어 설정 없음 (한국어만 지원)');
    }
  });

  test('로그아웃 기능', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    await waitForPageLoad(authenticatedPage);

    // 로그아웃 버튼 찾기
    const logoutButton = authenticatedPage.locator('button:has-text("로그아웃"), button:has-text("로그 아웃")');
    
    // 로그아웃 버튼이 없으면 설정 페이지로
    const hasLogoutOnProfile = await logoutButton.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasLogoutOnProfile) {
      console.log('프로필 페이지에 로그아웃 없음, 설정 페이지로 이동');
      await authenticatedPage.goto('/settings');
      await waitForPageLoad(authenticatedPage);
    }

    await stabilizeForScreenshot(authenticatedPage);
    
    // AI로 현재 페이지 분석 (로그아웃 버튼 확인)
    const pageAnalysis = await analyzePageWithAI(
      authenticatedPage,
      '로그아웃 버튼이 명확하게 보이고 쉽게 접근할 수 있어야 합니다.',
      '로그아웃 옵션 위치'
    );

    saveTestResult('logout-button-ui', pageAnalysis);

    // 로그아웃 버튼 확인
    const hasLogoutButton = await logoutButton.first().isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasLogoutButton) {
      console.log('✅ 로그아웃 버튼 발견');
      // 실제 로그아웃은 테스트 데이터 유지를 위해 스킵
      console.log('ℹ️ 실제 로그아웃은 수행하지 않음 (테스트 데이터 유지)');
    } else {
      console.log('ℹ️ 로그아웃 버튼이 현재 화면에 없음 (구현 예정이거나 다른 위치에 있을 수 있음)');
    }
  });

  test('계정 삭제 기능 (있는 경우)', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/settings');
    await waitForPageLoad(authenticatedPage);

    // 계정 삭제 버튼 찾기
    const deleteAccountButton = authenticatedPage.locator('button:has-text("계정 삭제"), button:has-text("탈퇴")');
    
    if (await deleteAccountButton.first().isVisible()) {
      console.log('⚠️ 계정 삭제 옵션 발견');

      await stabilizeForScreenshot(authenticatedPage);
      const deleteAccountAnalysis = await analyzePageWithAI(
        authenticatedPage,
        '계정 삭제는 중요한 작업이므로, 명확한 경고와 확인 절차가 있어야 합니다. 빨간색 등 주의를 끄는 색상을 사용해야 합니다.',
        '계정 삭제 옵션'
      );

      saveTestResult('delete-account-ui', deleteAccountAnalysis);

      // 실제로 삭제하지는 않음 (테스트이므로)
      console.log('ℹ️ 계정 삭제는 실제로 수행하지 않습니다 (테스트)');
    } else {
      console.log('ℹ️ 계정 삭제 옵션 없음');
    }
  });

  test('프로필 접근성 테스트', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    await waitForPageLoad(authenticatedPage);

    // AI 접근성 분석
    const accessibilityResult = await analyzeAccessibility(authenticatedPage);

    console.log('♿ 프로필 페이지 접근성 분석:');
    console.log('  점수:', accessibilityResult.score, '/100');
    console.log('  이슈:', accessibilityResult.issues);
    console.log('  권장사항:', accessibilityResult.recommendations);

    // 접근성 점수가 낮으면 경고 (참고용)
    if (accessibilityResult.score < 70) {
      console.warn('⚠️ 접근성 점수가 낮습니다. 개선 권장:', accessibilityResult.score);
      console.warn('  주요 개선사항:', accessibilityResult.recommendations.slice(0, 3));
    }

    // 점수가 너무 낮지 않으면 통과 (참고용 점수)
    expect(accessibilityResult.score).toBeGreaterThan(50);
  });

  test('모바일 반응형 - 프로필', async ({ authenticatedPage }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 13 Pro' },
    ];

    for (const viewport of viewports) {
      await authenticatedPage.setViewportSize(viewport);
      await authenticatedPage.goto('/profile');
      await waitForPageLoad(authenticatedPage);
      await stabilizeForScreenshot(authenticatedPage);

      const responsiveAnalysis = await analyzePageWithAI(
        authenticatedPage,
        `${viewport.name}에서 프로필 페이지가 잘 표시되어야 합니다. 모든 요소가 화면에 맞게 배치되어야 합니다.`,
        `프로필 페이지 - ${viewport.name}`
      );

      saveTestResult(`profile-responsive-${viewport.name}`, responsiveAnalysis);

      if (responsiveAnalysis.issues.length > 0) {
        console.warn(`⚠️ ${viewport.name} 반응형 이슈:`, responsiveAnalysis.issues);
      }
    }
  });

  test('사이드 메뉴 접근', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/home');
    await waitForPageLoad(authenticatedPage);

    // 메뉴 버튼 찾기 (햄버거 메뉴)
    const menuButton = authenticatedPage.locator('[data-testid="menu-button"], button:has-text("메뉴"), button[aria-label="메뉴"]');
    
    if (await menuButton.first().isVisible()) {
      await menuButton.first().click();

      // 사이드 메뉴가 열릴 때까지 대기
      await authenticatedPage.waitForTimeout(500);
      await stabilizeForScreenshot(authenticatedPage);

      // AI로 사이드 메뉴 분석
      const sideMenuAnalysis = await analyzePageWithAI(
        authenticatedPage,
        '사이드 메뉴가 열렸을 때, 프로필, 설정, 로그아웃 등의 옵션이 명확하게 표시되어야 합니다. 네비게이션이 쉬워야 합니다.',
        '사이드 메뉴'
      );

      saveTestResult('side-menu', sideMenuAnalysis);

      console.log('📱 사이드 메뉴 AI 분석:');
      console.log('  통과:', sideMenuAnalysis.passed ? '✅' : '❌');
      console.log('  분석:', sideMenuAnalysis.analysis);
    } else {
      console.log('ℹ️ 사이드 메뉴 버튼을 찾을 수 없음');
    }
  });

  test('앱 정보 페이지', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/app-info');
    await waitForPageLoad(authenticatedPage);
    await stabilizeForScreenshot(authenticatedPage);

    // AI로 앱 정보 페이지 분석
    const appInfoAnalysis = await analyzePageWithAI(
      authenticatedPage,
      '앱 정보 페이지에 버전, 개발자 정보, 이용약관, 개인정보처리방침 등이 표시되어야 합니다.',
      '앱 정보 페이지'
    );

    saveTestResult('app-info-page', appInfoAnalysis);

    console.log('ℹ️ 앱 정보 페이지 AI 분석:');
    console.log('  통과:', appInfoAnalysis.passed ? '✅' : '❌');
    console.log('  분석:', appInfoAnalysis.analysis);
  });
});
