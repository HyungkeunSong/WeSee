/**
 * AI 기반 테스트 케이스 자동 생성기
 * 코드베이스를 분석하여 테스트 케이스를 자동 생성
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

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

export interface GeneratedTest {
  testName: string;
  description: string;
  code: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

export interface TestSuite {
  suiteName: string;
  description: string;
  tests: GeneratedTest[];
}

/**
 * 페이지 컴포넌트를 분석하여 테스트 케이스 생성
 */
export async function generateTestsFromComponent(
  componentPath: string,
  componentCode: string
): Promise<TestSuite> {
  const prompt = `
당신은 테스트 자동화 전문가입니다. 다음 Next.js 페이지 컴포넌트를 분석하고 Playwright 테스트 케이스를 생성해주세요.

**컴포넌트 경로:** ${componentPath}

**컴포넌트 코드:**
\`\`\`typescript
${componentCode.substring(0, 4000)}
\`\`\`

다음 사항을 고려하여 테스트 케이스를 생성해주세요:
1. 렌더링 테스트 (UI 요소가 제대로 표시되는지)
2. 사용자 인터랙션 테스트 (버튼 클릭, 입력, 네비게이션 등)
3. 폼 검증 테스트
4. API 호출 테스트
5. 에러 핸들링 테스트
6. 모바일 반응형 테스트
7. 접근성 테스트

각 테스트는 다음 구조로 작성해주세요:
- test.describe() 블록 사용
- AI Vision 분석 통합
- 적절한 어설션
- 에러 핸들링

JSON 형식으로 응답:
{
  "suiteName": "테스트 스위트 이름",
  "description": "테스트 스위트 설명",
  "tests": [
    {
      "testName": "테스트 이름",
      "description": "테스트 설명",
      "code": "실제 Playwright 테스트 코드 (import문 포함)",
      "priority": "high|medium|low",
      "estimatedTime": "예상 실행 시간"
    }
  ]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJsonResponse(content);
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('테스트 생성 오류:', error);
    return {
      suiteName: 'Generated Tests',
      description: '자동 생성된 테스트',
      tests: [],
    };
  }
}

/**
 * API 라우트를 분석하여 테스트 케이스 생성
 */
export async function generateAPITests(
  routePath: string,
  routeCode: string
): Promise<TestSuite> {
  const prompt = `
다음 Next.js API 라우트를 분석하고 테스트 케이스를 생성해주세요.

**API 경로:** ${routePath}

**API 코드:**
\`\`\`typescript
${routeCode.substring(0, 4000)}
\`\`\`

다음 테스트를 생성해주세요:
1. 성공 케이스 (200/201 응답)
2. 인증 테스트 (401/403)
3. 유효성 검증 테스트 (400)
4. 에러 핸들링 (500)
5. 엣지 케이스
6. 성능 테스트 (응답 시간)

Playwright의 request API를 사용하여 작성해주세요.

JSON 형식으로 응답:
{
  "suiteName": "API 테스트 스위트 이름",
  "description": "설명",
  "tests": [...]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJsonResponse(content);
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('API 테스트 생성 오류:', error);
    return {
      suiteName: 'Generated API Tests',
      description: '자동 생성된 API 테스트',
      tests: [],
    };
  }
}

/**
 * 사용자 스토리로부터 E2E 테스트 생성
 */
export async function generateE2ETestFromUserStory(
  userStory: string
): Promise<GeneratedTest> {
  const prompt = `
다음 사용자 스토리를 Playwright E2E 테스트로 변환해주세요.

**사용자 스토리:**
${userStory}

다음을 포함하는 완전한 테스트 코드를 생성해주세요:
1. 테스트 setup
2. 각 단계별 액션
3. AI Vision을 사용한 UI 검증
4. 적절한 대기 및 에러 핸들링
5. 테스트 cleanup

우리 프로젝트 구조:
- test fixture 사용: import { test, expect } from '../utils/fixtures'
- AI 분석: aiAnalysis() 함수 사용 가능
- 헬퍼: test-helpers.ts에 다양한 헬퍼 함수 있음

JSON 형식으로 응답:
{
  "testName": "테스트 이름",
  "description": "설명",
  "code": "완전한 테스트 코드",
  "priority": "high",
  "estimatedTime": "2분"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJsonResponse(content);
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('E2E 테스트 생성 오류:', error);
    return {
      testName: 'Generated E2E Test',
      description: '자동 생성된 테스트',
      code: '',
      priority: 'medium',
      estimatedTime: '1분',
    };
  }
}

/**
 * 버그 리포트로부터 회귀 테스트 생성
 */
export async function generateRegressionTest(bugReport: {
  title: string;
  description: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
}): Promise<GeneratedTest> {
  const prompt = `
다음 버그 리포트를 바탕으로 회귀 테스트를 생성해주세요.

**버그 제목:** ${bugReport.title}
**설명:** ${bugReport.description}
**재현 단계:**
${bugReport.stepsToReproduce.map((step, i) => `${i + 1}. ${step}`).join('\n')}

**기대 동작:** ${bugReport.expectedBehavior}
**실제 동작:** ${bugReport.actualBehavior}

이 버그가 다시 발생하지 않도록 방지하는 회귀 테스트를 작성해주세요.
AI Vision으로 UI를 검증하고, 버그 발생 시 상세한 리포트를 생성하도록 해주세요.

JSON 형식으로 응답:
{
  "testName": "회귀 테스트 이름",
  "description": "설명",
  "code": "테스트 코드",
  "priority": "high",
  "estimatedTime": "1분"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJsonResponse(content);
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('회귀 테스트 생성 오류:', error);
    return {
      testName: 'Regression Test',
      description: '자동 생성된 회귀 테스트',
      code: '',
      priority: 'high',
      estimatedTime: '1분',
    };
  }
}

/**
 * 생성된 테스트를 파일로 저장
 */
export function saveGeneratedTest(
  test: GeneratedTest,
  outputPath: string
) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, test.code, 'utf-8');
  console.log(`✅ 테스트 생성 완료: ${outputPath}`);
}

/**
 * 테스트 스위트를 파일로 저장
 */
export function saveTestSuite(
  suite: TestSuite,
  outputPath: string
) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 전체 테스트 스위트를 하나의 파일로
  const fullCode = `
/**
 * ${suite.suiteName}
 * ${suite.description}
 * 
 * 🤖 AI가 자동으로 생성한 테스트입니다.
 * 생성 시간: ${new Date().toISOString()}
 */

import { test, expect } from '../utils/fixtures';

test.describe('${suite.suiteName}', () => {
${suite.tests.map((t) => `
  test('${t.testName}', async ({ page, aiAnalysis }) => {
    // ${t.description}
    // 우선순위: ${t.priority}
    // 예상 시간: ${t.estimatedTime}
    
${t.code.replace(/^/gm, '    ')}
  });
`).join('\n')}
});
`;

  fs.writeFileSync(outputPath, fullCode, 'utf-8');
  console.log(`✅ 테스트 스위트 생성 완료: ${outputPath}`);
  console.log(`   - ${suite.tests.length}개의 테스트 생성됨`);
}

/**
 * 전체 앱을 분석하여 테스트 플랜 생성
 */
export async function generateTestPlan(
  appStructure: string
): Promise<{
  overview: string;
  prioritizedFeatures: string[];
  testStrategy: string;
  estimatedCoverage: number;
}> {
  const prompt = `
다음 앱 구조를 분석하고 포괄적인 테스트 플랜을 작성해주세요.

**앱 구조:**
${appStructure}

다음을 생성해주세요:
1. 테스트 전략 개요
2. 우선순위별 기능 목록
3. 추천 테스트 전략 (E2E, 통합, 단위)
4. 예상 커버리지

JSON 형식으로 응답:
{
  "overview": "테스트 전략 개요",
  "prioritizedFeatures": ["우선순위 높은 기능들"],
  "testStrategy": "상세 전략",
  "estimatedCoverage": 85
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{}';
    const cleanedContent = cleanJsonResponse(content);
    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('테스트 플랜 생성 오류:', error);
    return {
      overview: '테스트 플랜 생성 실패',
      prioritizedFeatures: [],
      testStrategy: '',
      estimatedCoverage: 0,
    };
  }
}
