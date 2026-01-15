/**
 * 테스트 헬퍼 함수들
 */

import { Page, expect } from '@playwright/test';

/**
 * 테스트용 사용자 생성
 */
export function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return {
    email: `test.user.${timestamp}.${random}@wesee.test`,
    password: 'TestPassword123!@#',
    nickname: `테스터${random}`,
  };
}

/**
 * 로그인 헬퍼
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // 로그인 성공 대기
  await page.waitForURL(/\/(home|profile|upload)/);
}

/**
 * 로그아웃 헬퍼
 */
export async function logout(page: Page) {
  // 사이드 메뉴 열기
  await page.click('[data-testid="menu-button"], button:has-text("메뉴")');
  
  // 로그아웃 버튼 클릭
  await page.click('button:has-text("로그아웃")');
  
  // 로그인 페이지로 리다이렉트 대기
  await page.waitForURL('/login');
}

/**
 * 페이지 로딩 완료 대기
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * 모바일 스와이프 시뮬레이션
 */
export async function swipeLeft(page: Page, selector?: string) {
  const element = selector ? await page.locator(selector) : page;
  const box = await (selector ? element.boundingBox() : page.viewportSize());
  
  if (!box) throw new Error('요소를 찾을 수 없습니다');
  
  await page.mouse.move(box.width - 50, box.height / 2);
  await page.mouse.down();
  await page.mouse.move(50, box.height / 2, { steps: 10 });
  await page.mouse.up();
}

export async function swipeRight(page: Page, selector?: string) {
  const element = selector ? await page.locator(selector) : page;
  const box = await (selector ? element.boundingBox() : page.viewportSize());
  
  if (!box) throw new Error('요소를 찾을 수 없습니다');
  
  await page.mouse.move(50, box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.width - 50, box.height / 2, { steps: 10 });
  await page.mouse.up();
}

/**
 * 이미지 업로드 헬퍼
 */
export async function uploadImage(page: Page, imagePath: string) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(imagePath);
  
  // 업로드 완료 대기
  await page.waitForLoadState('networkidle');
}

/**
 * 토스트/알림 메시지 확인
 */
export async function expectToast(page: Page, message: string) {
  const toast = page.locator('[role="alert"], .toast, [data-testid="toast"]');
  await expect(toast).toContainText(message, { timeout: 5000 });
}

/**
 * 로딩 스피너 대기
 */
export async function waitForLoading(page: Page) {
  // 로딩 표시 나타남
  const loader = page.locator('[data-testid="loading"], .loading, .spinner');
  await loader.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
  
  // 로딩 표시 사라짐
  await loader.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

/**
 * 바텀 시트 열기
 */
export async function openBottomSheet(page: Page, triggerSelector: string) {
  await page.click(triggerSelector);
  
  // 바텀 시트가 나타날 때까지 대기
  const bottomSheet = page.locator('[data-testid="bottom-sheet"], [role="dialog"]');
  await bottomSheet.waitFor({ state: 'visible' });
}

/**
 * 바텀 시트 닫기
 */
export async function closeBottomSheet(page: Page) {
  // backdrop 클릭 또는 닫기 버튼
  await page.click('[data-testid="bottom-sheet-backdrop"], [data-testid="close-button"]');
  
  const bottomSheet = page.locator('[data-testid="bottom-sheet"], [role="dialog"]');
  await bottomSheet.waitFor({ state: 'hidden' });
}

/**
 * 네비게이션 바 확인
 */
export async function expectBottomNavigation(page: Page) {
  const nav = page.locator('nav, [data-testid="bottom-nav"]');
  await expect(nav).toBeVisible();
  
  // 주요 탭 확인
  await expect(page.locator('a[href="/home"], button:has-text("홈")')).toBeVisible();
  await expect(page.locator('a[href="/upload"], button:has-text("업로드")')).toBeVisible();
  await expect(page.locator('a[href="/analysis"], button:has-text("분석")')).toBeVisible();
}

/**
 * API 응답 대기
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  method: string = 'GET'
) {
  return page.waitForResponse(
    (response) =>
      (typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) &&
      response.request().method() === method
  );
}

/**
 * 에러 메시지 캡처
 */
export async function captureErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  
  return errors;
}

/**
 * 스크린샷 비교를 위한 안정화 대기
 */
export async function stabilizeForScreenshot(page: Page) {
  // 애니메이션 완료 대기
  await page.waitForTimeout(500);
  
  // 네트워크 요청 완료 대기
  await page.waitForLoadState('networkidle');
  
  // 추가 안정화 시간
  await page.waitForTimeout(300);
}
