/**
 * Playwright 커스텀 픽스처
 * 테스트 간 공유되는 설정 및 데이터
 */

import { test as base } from '@playwright/test';
import { generateTestUser, login } from './test-helpers';
import { analyzePageWithAI, AITestResult } from './ai-vision';

type TestFixtures = {
  testUser: { email: string; password: string; nickname: string };
  authenticatedPage: any;
  aiAnalysis: (expectedBehavior: string, context?: string) => Promise<AITestResult>;
};

/**
 * 테스트 픽스처 확장
 */
export const test = base.extend<TestFixtures>({
  // 테스트용 사용자 자동 생성
  testUser: async ({}, use) => {
    const user = generateTestUser();
    await use(user);
  },

  // 인증된 페이지 (자동 로그인)
  authenticatedPage: async ({ page, testUser }, use) => {
    // 회원가입
    await page.goto('/signup');
    await page.fill('input#name', testUser.nickname);  // 이름 필드
    await page.fill('input#email', testUser.email);
    await page.fill('input#password', testUser.password);
    await page.fill('input#confirmPassword', testUser.password);
    await page.click('button[type="submit"]');
    
    // 회원가입 완료 화면 대기
    await page.waitForSelector('h1:has-text("회원가입 완료")', { timeout: 15000 });
    
    // "시작하기" 버튼 클릭
    await page.click('button:has-text("시작하기")');
    
    // 메인 화면으로 이동 대기
    await page.waitForURL(/\/(home|profile|upload|\/)/, { timeout: 15000 });
    
    await use(page);
    
    // 테스트 종료 후 로그아웃 (선택적)
    // await logout(page);
  },

  // AI 분석 헬퍼
  aiAnalysis: async ({ page }, use) => {
    await use(async (expectedBehavior: string, context?: string) => {
      return analyzePageWithAI(page, expectedBehavior, context);
    });
  },
});

export { expect } from '@playwright/test';
