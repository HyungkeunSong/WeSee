import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// .env.local 파일 로드
dotenv.config({ path: '.env.local' });

/**
 * Playwright 설정
 * AI 기반 시각적 테스트를 위한 구성
 */
export default defineConfig({
  testDir: './tests',
  
  // 테스트 타임아웃 설정 (AI 분석 시간 고려)
  timeout: 120000, // 2분
  expect: {
    timeout: 15000,
  },

  // 병렬 실행 설정
  fullyParallel: false, // AI 분석의 정확성을 위해 순차 실행
  
  // 실패 시 재시도
  retries: process.env.CI ? 2 : 1,
  
  // 워커 수
  workers: process.env.CI ? 1 : 2,

  // 리포터 설정
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  // 스크린샷 및 비디오 저장
  use: {
    // 베이스 URL
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    
    // 트레이스 기록
    trace: 'retain-on-failure',
    
    // 스크린샷
    screenshot: 'on',
    
    // 비디오 녹화
    video: 'retain-on-failure',
    
    // 뷰포트 설정 (모바일 최적화)
    viewport: { width: 390, height: 844 },
    
    // 액션 타임아웃
    actionTimeout: 15000,
  },

  // 프로젝트 설정 (다양한 디바이스 테스트)
  projects: [
    {
      name: 'iPhone 13 Pro',
      use: { 
        ...devices['iPhone 13 Pro'],
        // AI 분석을 위한 고해상도
        deviceScaleFactor: 3,
      },
    },
    {
      name: 'Samsung Galaxy S21',
      use: { 
        ...devices['Galaxy S9+'],
      },
    },
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // 웹서버 설정 (로컬 개발 서버)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
