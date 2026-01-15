/**
 * AI 기반 자동 버그 감지 시스템
 * 테스트 실행 중 자동으로 UI/UX 이슈를 감지하고 리포트 생성
 */

import { Page, TestInfo } from '@playwright/test';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { analyzePageWithAI } from './ai-vision';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OpenAI 응답에서 마크다운 코드 블록 제거
 */
function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

export interface BugReport {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  screenshot: string;
  pageUrl: string;
  timestamp: string;
  suggestions: string[];
}

export interface TestRunReport {
  testRunId: string;
  startTime: string;
  endTime?: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  bugs: BugReport[];
  overallScore: number;
  recommendations: string[];
}

let currentTestRun: TestRunReport | null = null;

/**
 * 테스트 실행 시작
 */
export function startTestRun() {
  const testRunId = `test-run-${Date.now()}`;
  currentTestRun = {
    testRunId,
    startTime: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    bugs: [],
    overallScore: 0,
    recommendations: [],
  };
  
  console.log('🚀 AI 버그 감지 시스템 시작:', testRunId);
  return testRunId;
}

/**
 * 테스트 실행 종료
 */
export function endTestRun() {
  if (!currentTestRun) return null;
  
  currentTestRun.endTime = new Date().toISOString();
  
  // 전체 점수 계산
  const bugSeverityScore = {
    critical: 20,
    high: 10,
    medium: 5,
    low: 2,
  };
  
  const totalBugScore = currentTestRun.bugs.reduce(
    (sum, bug) => sum + bugSeverityScore[bug.severity],
    0
  );
  
  // 100점 만점 기준
  currentTestRun.overallScore = Math.max(0, 100 - totalBugScore);
  
  console.log('🏁 테스트 실행 완료');
  console.log('  총 테스트:', currentTestRun.totalTests);
  console.log('  통과:', currentTestRun.passedTests);
  console.log('  실패:', currentTestRun.failedTests);
  console.log('  버그 발견:', currentTestRun.bugs.length);
  console.log('  전체 점수:', currentTestRun.overallScore, '/100');
  
  return currentTestRun;
}

/**
 * 페이지를 자동으로 스캔하여 잠재적 버그 감지
 */
export async function scanPageForBugs(
  page: Page,
  context?: string
): Promise<BugReport[]> {
  const bugs: BugReport[] = [];
  
  try {
    // 1. 스크린샷 촬영
    const screenshot = await page.screenshot({ fullPage: true });
    const screenshotBase64 = screenshot.toString('base64');
    
    // 2. 페이지 정보 수집
    const url = page.url();
    const title = await page.title();
    const html = await page.content();
    
    // 3. 콘솔 에러 확인
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 4. AI로 페이지 분석
    const prompt = `
당신은 QA 전문가입니다. 다음 웹페이지를 분석하여 버그나 이슈를 찾아주세요.

**페이지 정보:**
- URL: ${url}
- 제목: ${title}
${context ? `- 컨텍스트: ${context}` : ''}

**콘솔 에러:** ${consoleErrors.length > 0 ? consoleErrors.join(', ') : '없음'}

**분석할 항목:**
1. UI 버그 (깨진 레이아웃, 겹치는 요소, 잘린 텍스트 등)
2. UX 이슈 (혼란스러운 네비게이션, 불명확한 버튼 등)
3. 접근성 문제
4. 성능 이슈 (과도한 로딩 시간 표시 등)
5. 모바일 최적화 문제
6. 오타나 번역 오류
7. 기능적 결함 (작동하지 않는 버튼, 깨진 링크 등)

각 버그를 다음 JSON 배열 형식으로 반환:
[
  {
    "severity": "critical|high|medium|low",
    "category": "UI|UX|Accessibility|Performance|Functional|Content",
    "title": "버그 제목",
    "description": "상세 설명",
    "stepsToReproduce": ["재현 단계들"],
    "expectedBehavior": "기대하는 동작",
    "actualBehavior": "실제 동작",
    "suggestions": ["수정 제안들"]
  }
]

버그가 없으면 빈 배열 []을 반환하세요.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshotBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content || '[]';
    const cleanedContent = cleanJsonResponse(content);
    const detectedBugs = JSON.parse(cleanedContent);
    
    // 버그 리포트 생성
    detectedBugs.forEach((bug: any, index: number) => {
      const bugReport: BugReport = {
        id: `bug-${Date.now()}-${index}`,
        severity: bug.severity || 'medium',
        category: bug.category || 'UI',
        title: bug.title,
        description: bug.description,
        stepsToReproduce: bug.stepsToReproduce || [],
        expectedBehavior: bug.expectedBehavior || '',
        actualBehavior: bug.actualBehavior || '',
        screenshot: screenshotBase64,
        pageUrl: url,
        timestamp: new Date().toISOString(),
        suggestions: bug.suggestions || [],
      };
      
      bugs.push(bugReport);
      
      // 현재 테스트 실행에 추가
      if (currentTestRun) {
        currentTestRun.bugs.push(bugReport);
      }
    });
    
    if (bugs.length > 0) {
      console.log(`🐛 ${bugs.length}개의 잠재적 버그 감지됨:`, url);
      bugs.forEach((bug) => {
        console.log(`  - [${bug.severity}] ${bug.title}`);
      });
    }
    
  } catch (error) {
    console.error('버그 스캔 오류:', error);
  }
  
  return bugs;
}

/**
 * 테스트 실패 시 자동으로 버그 리포트 생성
 */
export async function captureTestFailure(
  page: Page,
  testInfo: TestInfo,
  error: Error
): Promise<BugReport> {
  const screenshot = await page.screenshot({ fullPage: true });
  
  const bugReport: BugReport = {
    id: `test-failure-${Date.now()}`,
    severity: 'high',
    category: 'Functional',
    title: `테스트 실패: ${testInfo.title}`,
    description: `테스트가 실패했습니다: ${error.message}`,
    stepsToReproduce: [
      `테스트 파일: ${testInfo.file}`,
      `테스트 이름: ${testInfo.title}`,
      '위 테스트를 실행하면 재현됩니다.',
    ],
    expectedBehavior: '테스트가 통과해야 합니다.',
    actualBehavior: error.message,
    screenshot: screenshot.toString('base64'),
    pageUrl: page.url(),
    timestamp: new Date().toISOString(),
    suggestions: ['에러 메시지를 확인하고 해당 기능을 수정하세요.'],
  };
  
  if (currentTestRun) {
    currentTestRun.bugs.push(bugReport);
    currentTestRun.failedTests++;
  }
  
  return bugReport;
}

/**
 * 버그 리포트를 HTML 형식으로 생성
 */
export function generateBugReportHTML(report: TestRunReport): string {
  const severityColors = {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#D97706',
    low: '#65A30D',
  };
  
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 버그 리포트 - ${report.testRunId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #F9FAFB;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .header h1 { font-size: 32px; color: #111827; margin-bottom: 10px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .stat {
      background: #F3F4F6;
      padding: 20px;
      border-radius: 8px;
    }
    .stat-label { font-size: 14px; color: #6B7280; margin-bottom: 5px; }
    .stat-value { font-size: 28px; font-weight: bold; color: #111827; }
    .score {
      font-size: 48px;
      font-weight: bold;
      color: ${report.overallScore >= 80 ? '#10B981' : report.overallScore >= 60 ? '#F59E0B' : '#EF4444'};
    }
    .bugs { margin-top: 20px; }
    .bug-card {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      border-left: 4px solid;
    }
    .bug-card.critical { border-left-color: #DC2626; }
    .bug-card.high { border-left-color: #EA580C; }
    .bug-card.medium { border-left-color: #D97706; }
    .bug-card.low { border-left-color: #65A30D; }
    .bug-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }
    .bug-severity {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      color: white;
      text-transform: uppercase;
    }
    .bug-category {
      background: #E5E7EB;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      color: #4B5563;
    }
    .bug-title { font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 10px; }
    .bug-description { color: #4B5563; line-height: 1.6; margin-bottom: 15px; }
    .bug-section { margin-top: 15px; }
    .bug-section h4 { font-size: 14px; color: #6B7280; margin-bottom: 8px; }
    .bug-section ul { padding-left: 20px; }
    .bug-section li { color: #4B5563; margin-bottom: 5px; }
    .screenshot {
      margin-top: 15px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #E5E7EB;
    }
    .screenshot img {
      width: 100%;
      height: auto;
      display: block;
    }
    .timestamp { font-size: 12px; color: #9CA3AF; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 AI 자동 버그 리포트</h1>
      <p style="color: #6B7280; margin-top: 10px;">
        테스트 실행 ID: ${report.testRunId}<br>
        실행 시간: ${report.startTime} ~ ${report.endTime || '진행 중'}
      </p>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-label">전체 점수</div>
          <div class="score">${report.overallScore}/100</div>
        </div>
        <div class="stat">
          <div class="stat-label">총 테스트</div>
          <div class="stat-value">${report.totalTests}</div>
        </div>
        <div class="stat">
          <div class="stat-label">통과</div>
          <div class="stat-value" style="color: #10B981;">${report.passedTests}</div>
        </div>
        <div class="stat">
          <div class="stat-label">실패</div>
          <div class="stat-value" style="color: #EF4444;">${report.failedTests}</div>
        </div>
        <div class="stat">
          <div class="stat-label">발견된 버그</div>
          <div class="stat-value" style="color: #F59E0B;">${report.bugs.length}</div>
        </div>
      </div>
    </div>
    
    ${report.bugs.length > 0 ? `
    <div class="bugs">
      <h2 style="font-size: 24px; margin-bottom: 20px; color: #111827;">발견된 버그 목록</h2>
      ${report.bugs.map(bug => `
        <div class="bug-card ${bug.severity}">
          <div class="bug-header">
            <span class="bug-severity" style="background: ${severityColors[bug.severity]};">${bug.severity}</span>
            <span class="bug-category">${bug.category}</span>
          </div>
          
          <h3 class="bug-title">${bug.title}</h3>
          <p class="bug-description">${bug.description}</p>
          
          <div class="bug-section">
            <h4>📍 페이지 URL</h4>
            <p style="color: #2563EB;">${bug.pageUrl}</p>
          </div>
          
          ${bug.stepsToReproduce.length > 0 ? `
          <div class="bug-section">
            <h4>🔄 재현 단계</h4>
            <ul>
              ${bug.stepsToReproduce.map(step => `<li>${step}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="bug-section">
            <h4>✅ 기대 동작</h4>
            <p style="color: #4B5563;">${bug.expectedBehavior}</p>
          </div>
          
          <div class="bug-section">
            <h4>❌ 실제 동작</h4>
            <p style="color: #4B5563;">${bug.actualBehavior}</p>
          </div>
          
          ${bug.suggestions.length > 0 ? `
          <div class="bug-section">
            <h4>💡 수정 제안</h4>
            <ul>
              ${bug.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="screenshot">
            <img src="data:image/png;base64,${bug.screenshot}" alt="Screenshot">
          </div>
          
          <p class="timestamp">발견 시각: ${bug.timestamp}</p>
        </div>
      `).join('')}
    </div>
    ` : `
    <div style="background: white; padding: 40px; text-align: center; border-radius: 12px;">
      <h2 style="color: #10B981; font-size: 24px;">🎉 버그가 발견되지 않았습니다!</h2>
      <p style="color: #6B7280; margin-top: 10px;">모든 테스트가 정상적으로 통과했습니다.</p>
    </div>
    `}
  </div>
</body>
</html>
`;
  
  return html;
}

/**
 * 버그 리포트 저장
 */
export function saveBugReport(report: TestRunReport, outputDir = 'test-results/bug-reports') {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // HTML 리포트
  const htmlContent = generateBugReportHTML(report);
  const htmlPath = path.join(outputDir, `${report.testRunId}.html`);
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  
  // JSON 리포트
  const jsonPath = path.join(outputDir, `${report.testRunId}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('📄 버그 리포트 저장 완료:');
  console.log('  HTML:', htmlPath);
  console.log('  JSON:', jsonPath);
  
  return { htmlPath, jsonPath };
}
