/**
 * AI Vision 테스트 유틸리티
 * GPT-4 Vision을 사용한 자동 시각적 테스트 및 버그 감지
 */

import { Page } from '@playwright/test';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AITestResult {
  passed: boolean;
  issues: string[];
  suggestions: string[];
  screenshot: string;
  analysis: string;
}

export interface VisualComparisonResult {
  similarity: number;
  differences: string[];
  passed: boolean;
}

/**
 * OpenAI 응답에서 마크다운 코드 블록 제거
 */
function cleanJsonResponse(content: string): string {
  // ```json ... ``` 또는 ``` ... ``` 형태의 마크다운 제거
  let cleaned = content.trim();
  
  // 시작 부분의 ```json 또는 ``` 제거
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  
  // 끝 부분의 ``` 제거
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  return cleaned.trim();
}

/**
 * AI가 화면을 분석하여 UI/UX 이슈를 감지
 */
export async function analyzePageWithAI(
  page: Page,
  expectedBehavior: string,
  context?: string
): Promise<AITestResult> {
  // 스크린샷 촬영
  const screenshotBuffer = await page.screenshot({ fullPage: true });
  const base64Image = screenshotBuffer.toString('base64');
  
  // 현재 페이지 정보
  const url = page.url();
  const title = await page.title();
  
  // AI 분석 프롬프트
  const prompt = `
당신은 모바일 앱 QA 전문가입니다. 다음 화면을 분석해주세요.

**페이지 정보:**
- URL: ${url}
- 제목: ${title}
${context ? `- 컨텍스트: ${context}` : ''}

**기대하는 동작:**
${expectedBehavior}

**분석 요청사항:**
1. UI/UX 이슈 (레이아웃, 색상, 타이포그래피, 정렬 등)
2. 접근성 문제
3. 모바일 최적화 이슈
4. 버튼이나 요소가 누락되었는지
5. 텍스트 오타나 번역 이슈
6. 기대하는 동작과 실제 화면의 일치 여부

다음 JSON 형식으로 응답해주세요:
{
  "passed": true/false,
  "issues": ["발견된 이슈들"],
  "suggestions": ["개선 제안들"],
  "analysis": "전체 분석 요약"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // 최신 비전 모델
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJsonResponse(content);
    const result = JSON.parse(cleanedContent);

    return {
      passed: result.passed ?? true,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      screenshot: base64Image,
      analysis: result.analysis || '분석 완료',
    };
  } catch (error) {
    console.error('AI 분석 오류:', error);
    return {
      passed: false,
      issues: [`AI 분석 실패: ${error}`],
      suggestions: [],
      screenshot: base64Image,
      analysis: 'AI 분석을 수행할 수 없습니다.',
    };
  }
}

/**
 * 두 화면을 비교하여 차이점 분석
 */
export async function compareScreenshotsWithAI(
  beforeImage: string,
  afterImage: string,
  context: string
): Promise<VisualComparisonResult> {
  const prompt = `
두 개의 화면을 비교하고 차이점을 분석해주세요.

**컨텍스트:** ${context}

다음 JSON 형식으로 응답해주세요:
{
  "similarity": 0-100 (유사도 백분율),
  "differences": ["발견된 차이점들"],
  "passed": true/false (의도된 변경인지 여부)
}
`;

  try {
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
                url: `data:image/png;base64,${beforeImage}`,
                detail: 'high',
              },
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${afterImage}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJsonResponse(content);
    const result = JSON.parse(cleanedContent);

    return {
      similarity: result.similarity || 0,
      differences: result.differences || [],
      passed: result.passed ?? true,
    };
  } catch (error) {
    console.error('화면 비교 오류:', error);
    return {
      similarity: 0,
      differences: [`비교 실패: ${error}`],
      passed: false,
    };
  }
}

/**
 * 사용자 플로우 전체를 AI가 분석
 */
export async function analyzeUserFlow(
  screenshots: { step: string; image: string; url: string }[],
  flowDescription: string
): Promise<{
  overallPassed: boolean;
  stepResults: { step: string; issues: string[] }[];
  flowAnalysis: string;
}> {
  const prompt = `
사용자 플로우를 분석해주세요.

**플로우 설명:** ${flowDescription}

**단계별 화면들:**
${screenshots.map((s, i) => `${i + 1}. ${s.step} (${s.url})`).join('\n')}

다음을 분석해주세요:
1. 각 단계가 자연스럽게 연결되는가?
2. 사용자 경험이 매끄러운가?
3. 각 단계에서 발견되는 이슈들
4. 전체 플로우의 개선점

JSON 형식으로 응답:
{
  "overallPassed": true/false,
  "stepResults": [{"step": "단계명", "issues": ["이슈들"]}],
  "flowAnalysis": "전체 분석"
}
`;

  try {
    const content: any[] = [{ type: 'text', text: prompt }];
    
    screenshots.forEach((shot) => {
      content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${shot.image}`,
          detail: 'low', // 여러 이미지이므로 low detail
        },
      });
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content }],
      max_tokens: 3000,
    });

    const flowContent = response.choices[0].message.content || '{}';
    const cleanedFlowContent = cleanJsonResponse(flowContent);
    const result = JSON.parse(cleanedFlowContent);

    return {
      overallPassed: result.overallPassed ?? true,
      stepResults: result.stepResults || [],
      flowAnalysis: result.flowAnalysis || '분석 완료',
    };
  } catch (error) {
    console.error('플로우 분석 오류:', error);
    return {
      overallPassed: false,
      stepResults: [],
      flowAnalysis: `플로우 분석 실패: ${error}`,
    };
  }
}

/**
 * 접근성 문제를 AI가 감지
 */
export async function analyzeAccessibility(
  page: Page
): Promise<{
  issues: string[];
  recommendations: string[];
  score: number;
}> {
  const screenshotBuffer = await page.screenshot({ fullPage: true });
  const base64Image = screenshotBuffer.toString('base64');
  
  const html = await page.content();

  const prompt = `
다음 웹페이지의 접근성을 분석해주세요.

**HTML 샘플:** ${html.substring(0, 2000)}...

**분석 요청:**
1. WCAG 2.1 가이드라인 준수 여부
2. 색상 대비 이슈
3. 키보드 네비게이션 가능성
4. 스크린 리더 호환성
5. 터치 타겟 크기
6. 폼 레이블 및 에러 메시지

JSON 형식으로 응답:
{
  "issues": ["발견된 접근성 이슈들"],
  "recommendations": ["개선 권장사항들"],
  "score": 0-100 (접근성 점수)
}
`;

  try {
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
                url: `data:image/png;base64,${base64Image}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJsonResponse(content);
    const result = JSON.parse(cleanedContent);

    return {
      issues: result.issues || [],
      recommendations: result.recommendations || [],
      score: result.score || 0,
    };
  } catch (error) {
    console.error('접근성 분석 오류:', error);
    return {
      issues: [`접근성 분석 실패: ${error}`],
      recommendations: [],
      score: 0,
    };
  }
}

/**
 * 테스트 결과를 파일로 저장
 */
export function saveTestResult(
  testName: string,
  result: AITestResult,
  outputDir = 'test-results/ai-analysis'
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${testName}-${timestamp}`;
  
  // 디렉토리 생성
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 스크린샷 저장
  const screenshotPath = path.join(outputDir, `${fileName}.png`);
  fs.writeFileSync(
    screenshotPath,
    Buffer.from(result.screenshot, 'base64')
  );

  // 분석 결과 저장
  const reportPath = path.join(outputDir, `${fileName}.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        testName,
        timestamp: new Date().toISOString(),
        passed: result.passed,
        issues: result.issues,
        suggestions: result.suggestions,
        analysis: result.analysis,
        screenshotPath,
      },
      null,
      2
    )
  );

  return { screenshotPath, reportPath };
}
