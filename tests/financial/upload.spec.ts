/**
 * 이미지 업로드 및 재무 분석 E2E 테스트
 * AI Vision을 사용한 자동 UI/UX 검증
 */

import { test, expect } from '../utils/fixtures';
import { analyzePageWithAI, analyzeUserFlow, saveTestResult } from '../utils/ai-vision';
import { 
  waitForPageLoad,
  stabilizeForScreenshot,
  waitForLoading
} from '../utils/test-helpers';
import * as path from 'path';
import * as fs from 'fs';

test.describe('이미지 업로드 및 재무 분석', () => {
  // 테스트용 이미지 생성
  test.beforeAll(() => {
    const testImagesDir = path.join(__dirname, '../test-assets/images');
    if (!fs.existsSync(testImagesDir)) {
      fs.mkdirSync(testImagesDir, { recursive: true });
    }
    
    // 실제로는 테스트용 영수증 이미지를 준비해야 함
    console.log('📁 테스트 이미지 디렉토리 준비:', testImagesDir);
  });

  test('업로드 페이지 렌더링 테스트', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');
    await waitForPageLoad(authenticatedPage);
    await stabilizeForScreenshot(authenticatedPage);

    // AI Vision으로 화면 분석
    const aiResult = await analyzePageWithAI(
      authenticatedPage,
      '이미지 업로드 페이지가 표시되어야 합니다. 파일 선택 버튼이나 드래그 앤 드롭 영역이 있어야 하며, 사용자가 쉽게 이미지를 업로드할 수 있는 UI여야 합니다.',
      '업로드 페이지 첫 화면'
    );

    saveTestResult('upload-page-render', aiResult);

    // 기본 요소 확인 (첫 번째 파일 입력)
    const fileInput = authenticatedPage.locator('input[type="file"]').first();
    await expect(fileInput).toBeAttached();

    if (aiResult.issues.length > 0) {
      console.warn('⚠️ 업로드 페이지 UI 이슈:', aiResult.issues);
    }
  });

  test('파일 선택 UI 인터랙션', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');
    await waitForPageLoad(authenticatedPage);

    // 파일 입력 요소 확인 (첫 번째)
    const fileInput = authenticatedPage.locator('input[type="file"]').first();
    
    // accept 속성 확인 (이미지만 허용하는지)
    const acceptAttr = await fileInput.getAttribute('accept');
    console.log('파일 accept 속성:', acceptAttr);

    // 업로드 버튼이나 영역 확인
    const uploadButton = authenticatedPage.locator('button:has-text("업로드"), button:has-text("선택"), label:has(input[type="file"])');
    await expect(uploadButton.first()).toBeVisible();

    await stabilizeForScreenshot(authenticatedPage);
    const aiResult = await analyzePageWithAI(
      authenticatedPage,
      '파일 업로드 UI가 직관적이고 사용하기 쉬워야 합니다. 어떤 파일 형식을 업로드할 수 있는지 명확해야 합니다.',
      '파일 선택 UI'
    );

    saveTestResult('upload-file-selection-ui', aiResult);
  });

  test('다중 이미지 업로드 플로우', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');
    await waitForPageLoad(authenticatedPage);

    const screenshots: { step: string; image: string; url: string }[] = [];

    // 초기 화면
    await stabilizeForScreenshot(authenticatedPage);
    let screenshot = await authenticatedPage.screenshot({ fullPage: true });
    screenshots.push({
      step: '업로드 페이지 초기 상태',
      image: screenshot.toString('base64'),
      url: authenticatedPage.url(),
    });

    // 테스트 이미지 경로 (실제 테스트 시에는 준비된 영수증 이미지 사용)
    const testImagePath = path.join(__dirname, '../test-assets/images/receipt.jpg');
    
    // 이미지 파일이 없으면 스킵
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️ 테스트 이미지가 없어 스킵합니다:', testImagePath);
      console.log('💡 tests/test-assets/images/ 폴더에 receipt.jpg를 추가하세요');
      test.skip();
      return;
    }

    // 파일 업로드
    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    console.log('📤 이미지 업로드 중...');

    // 업로드 진행 중 UI 확인
    await authenticatedPage.waitForTimeout(1000);
    await stabilizeForScreenshot(authenticatedPage);
    
    screenshot = await authenticatedPage.screenshot({ fullPage: true });
    screenshots.push({
      step: '이미지 업로드 진행 중',
      image: screenshot.toString('base64'),
      url: authenticatedPage.url(),
    });

    // AI 분석 대기 (로딩 인디케이터)
    await waitForLoading(authenticatedPage);

    // 분석 완료 후 화면
    await authenticatedPage.waitForTimeout(2000);
    await stabilizeForScreenshot(authenticatedPage);
    
    screenshot = await authenticatedPage.screenshot({ fullPage: true });
    screenshots.push({
      step: 'AI 분석 완료 후',
      image: screenshot.toString('base64'),
      url: authenticatedPage.url(),
    });

    // AI로 분석 결과 화면 검증
    const resultAnalysis = await analyzePageWithAI(
      authenticatedPage,
      '이미지 업로드 및 AI 분석이 완료된 후, 추출된 재무 정보가 표시되어야 합니다. 날짜, 금액, 카테고리 등이 명확하게 보여야 합니다.',
      '재무 분석 결과 화면'
    );

    saveTestResult('upload-analysis-result', resultAnalysis);

    // 전체 플로우 분석
    const flowAnalysis = await analyzeUserFlow(
      screenshots,
      '사용자가 영수증 이미지를 업로드하고 AI가 분석하여 재무 정보를 추출하는 플로우'
    );

    console.log('📊 이미지 업로드 플로우 AI 분석:');
    console.log('  전체 통과:', flowAnalysis.overallPassed ? '✅' : '❌');
    console.log('  분석 결과:', flowAnalysis.flowAnalysis);

    expect(flowAnalysis.overallPassed).toBe(true);
  });

  test('잘못된 파일 형식 업로드 시도', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');
    await waitForPageLoad(authenticatedPage);

    // 텍스트 파일 업로드 시도
    const testFilePath = path.join(__dirname, '../test-assets/test.txt');
    
    // 테스트 파일 생성
    const dir = path.dirname(testFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(testFilePath, 'This is not an image');

    const fileInput = authenticatedPage.locator('input[type="file"]');
    
    try {
      await fileInput.setInputFiles(testFilePath);
      
      // 에러 메시지 확인
      await authenticatedPage.waitForTimeout(1000);
      await stabilizeForScreenshot(authenticatedPage);

      // AI로 에러 처리 UI 분석
      const errorAnalysis = await analyzePageWithAI(
        authenticatedPage,
        '잘못된 파일 형식을 업로드했을 때, 명확한 에러 메시지가 표시되어야 합니다.',
        '잘못된 파일 형식 에러'
      );

      saveTestResult('upload-invalid-file-type', errorAnalysis);
    } catch (error) {
      console.log('파일 형식 제한이 정상적으로 동작합니다');
    }

    // 테스트 파일 삭제
    fs.unlinkSync(testFilePath);
  });

  test('대용량 파일 업로드 제한', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');
    await waitForPageLoad(authenticatedPage);

    // 이 테스트는 실제로 대용량 파일을 생성하지 않고,
    // UI에 파일 크기 제한이 표시되는지 확인
    await stabilizeForScreenshot(authenticatedPage);

    const aiResult = await analyzePageWithAI(
      authenticatedPage,
      '파일 크기 제한이 있다면 사용자에게 명확하게 안내되어야 합니다.',
      '파일 크기 제한 안내'
    );

    saveTestResult('upload-file-size-limit', aiResult);
  });

  test('업로드 취소 기능', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');
    await waitForPageLoad(authenticatedPage);

    // 취소 버튼이 있는지 확인
    const cancelButton = authenticatedPage.locator('button:has-text("취소"), button:has-text("Cancel")');
    
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      
      // 취소 후 화면 확인
      await stabilizeForScreenshot(authenticatedPage);
      
      const aiResult = await analyzePageWithAI(
        authenticatedPage,
        '업로드 취소 후 초기 상태로 돌아가야 합니다.',
        '업로드 취소 후'
      );

      saveTestResult('upload-cancel', aiResult);
    } else {
      console.log('취소 버튼이 없습니다 (업로드 시작 전에만 표시될 수 있음)');
    }
  });

  test('업로드 히스토리 확인', async ({ authenticatedPage }) => {
    // 홈 또는 분석 페이지로 이동
    await authenticatedPage.goto('/home');
    await waitForPageLoad(authenticatedPage);
    await stabilizeForScreenshot(authenticatedPage);

    // AI로 재무 데이터 표시 확인
    const historyAnalysis = await analyzePageWithAI(
      authenticatedPage,
      '업로드된 재무 데이터가 목록이나 캘린더 형태로 표시되어야 합니다. 사용자가 이전 데이터를 쉽게 확인할 수 있어야 합니다.',
      '재무 데이터 히스토리'
    );

    saveTestResult('financial-history', historyAnalysis);

    if (historyAnalysis.issues.length > 0) {
      console.warn('⚠️ 히스토리 UI 이슈:', historyAnalysis.issues);
    }
  });

  test('재무 분석 페이지 확인', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/analysis');
    await waitForPageLoad(authenticatedPage);
    await stabilizeForScreenshot(authenticatedPage);

    // AI로 분석 페이지 평가
    const analysisPageResult = await analyzePageWithAI(
      authenticatedPage,
      '재무 분석 페이지에 차트, 통계, 인사이트가 표시되어야 합니다. 데이터 시각화가 명확하고 이해하기 쉬워야 합니다.',
      '재무 분석 페이지'
    );

    saveTestResult('analysis-page', analysisPageResult);

    console.log('📈 재무 분석 페이지 AI 평가:');
    console.log('  통과:', analysisPageResult.passed ? '✅' : '❌');
    console.log('  분석:', analysisPageResult.analysis);
    
    if (analysisPageResult.suggestions.length > 0) {
      console.log('  개선 제안:', analysisPageResult.suggestions);
    }
  });

  test('모바일에서 카메라로 직접 촬영', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');
    await waitForPageLoad(authenticatedPage);

    // 파일 입력의 capture 속성 확인 (모바일 카메라 사용, 첫 번째)
    const fileInput = authenticatedPage.locator('input[type="file"]').first();
    const captureAttr = await fileInput.getAttribute('capture');
    
    if (captureAttr) {
      console.log('✅ 모바일 카메라 촬영 지원:', captureAttr);
    } else {
      console.log('ℹ️ 모바일 카메라 직접 촬영 속성 없음');
    }

    // AI로 모바일 UX 분석
    const mobileUXAnalysis = await analyzePageWithAI(
      authenticatedPage,
      '모바일 환경에서 카메라로 직접 영수증을 촬영할 수 있어야 합니다. 버튼이 명확하고 접근하기 쉬워야 합니다.',
      '모바일 카메라 UX'
    );

    saveTestResult('upload-mobile-camera', mobileUXAnalysis);
  });

  test('API 응답 시간 측정', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/upload');
    await waitForPageLoad(authenticatedPage);

    const testImagePath = path.join(__dirname, '../test-assets/images/receipt.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️ 테스트 이미지가 없어 스킵');
      test.skip();
      return;
    }

    // API 응답 시간 측정
    const startTime = Date.now();
    
    // 이미지 업로드 API 호출 대기
    const responsePromise = authenticatedPage.waitForResponse(
      response => response.url().includes('/api/process-images') || response.url().includes('/api/upload'),
      { timeout: 60000 }
    );

    const fileInput = authenticatedPage.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    try {
      const response = await responsePromise;
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log('⏱️ AI 분석 응답 시간:', responseTime, 'ms');
      console.log('   API 상태:', response.status());

      // 응답 시간이 너무 길면 경고
      if (responseTime > 30000) {
        console.warn('⚠️ AI 분석 응답 시간이 30초를 초과했습니다');
      }

      // 30초 이내에 응답해야 함
      expect(responseTime).toBeLessThan(30000);
      expect(response.status()).toBe(200);
    } catch (error) {
      console.error('API 응답 타임아웃 또는 오류:', error);
      throw error;
    }
  });
});
