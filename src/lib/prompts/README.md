# GPT Vision API 프롬프트

이 폴더는 토스 앱 스크린샷을 분석하기 위한 GPT Vision API 프롬프트를 관리합니다.

## 파일 구조

```
prompts/
├── README.md                      # 이 파일
├── index.ts                       # 프롬프트 export 및 설정
├── calendar-image-prompt.ts       # 월간 캘린더 이미지 분석 프롬프트
└── analysis-image-prompt.ts       # 소비분석 이미지 분석 프롬프트
```

## 프롬프트 종류

### 1. Calendar Image Prompt (캘린더 이미지)
- **파일**: `calendar-image-prompt.ts`
- **목적**: 토스 월간 수입/지출 캘린더 화면 분석
- **추출 데이터**:
  - 날짜별 수입/지출 금액
  - 월 총 수입/지출/순수입
- **출력 형식**: `{ year, month, dailyTransactions, summary }`

### 2. Analysis Image Prompt (소비분석 이미지)
- **파일**: `analysis-image-prompt.ts`
- **목적**: 토스 월간 소비분석 화면 분석
- **추출 데이터**:
  - 카테고리별 소비 금액
  - 카테고리별 비율 (%)
- **출력 형식**: `{ year, month, totalExpense, categoryAnalysis }`

## 사용 방법

```typescript
import { 
  CALENDAR_IMAGE_PROMPT, 
  ANALYSIS_IMAGE_PROMPT,
  GPT_CONFIG,
  getPromptByImageType,
  ImageType 
} from '@/lib/prompts';

// 방법 1: 직접 import
const calendarPrompt = CALENDAR_IMAGE_PROMPT;

// 방법 2: 타입으로 선택
const prompt = getPromptByImageType(ImageType.CALENDAR);

// GPT API 호출 예시
const response = await openai.chat.completions.create({
  ...GPT_CONFIG,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: CALENDAR_IMAGE_PROMPT },
        { 
          type: 'image_url', 
          image_url: { url: imageUrl } 
        }
      ]
    }
  ]
});
```

## GPT 모델 설정

- **모델**: gpt-5.2 (사용자 지정)
- **Temperature**: 0 (일관성 최대화)
- **Response Format**: JSON Object
- **Max Tokens**: 4096

## 프롬프트 최적화 가이드

프롬프트를 수정할 때 다음 사항을 고려하세요:

1. **명확한 지시사항**
   - 무엇을 추출해야 하는지 명확히 명시
   - 예외 케이스 처리 방법 설명

2. **출력 형식 강제**
   - JSON 스키마를 명확히 제시
   - 예시 데이터 포함

3. **검증 규칙 명시**
   - 숫자 형식, 범위 체크
   - 합계 일치 여부 확인

4. **에러 방지**
   - 읽기 어려운 경우 처리 방법
   - 데이터 없는 경우 처리 방법

## 테스트

프롬프트를 수정한 후에는 다양한 토스 스크린샷으로 테스트하세요:

- [ ] 일반적인 월간 데이터
- [ ] 수입이 없는 월
- [ ] 지출이 없는 날
- [ ] 여러 줄의 거래가 있는 날
- [ ] 특수 문자가 포함된 금액
- [ ] 화질이 낮은 이미지
- [ ] 카테고리가 많은/적은 경우

## 비용 최적화

- 이미지 해상도를 적절히 조정 (너무 높은 해상도는 불필요)
- Temperature 0으로 설정하여 재시도 최소화
- 성공적인 응답은 캐싱하여 재사용

## 변경 이력

- 2026-01-12: 초기 프롬프트 작성
  - 캘린더 이미지 프롬프트
  - 소비분석 이미지 프롬프트
  - GPT-5.2 모델 설정
