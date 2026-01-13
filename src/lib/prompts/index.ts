/**
 * GPT Vision API용 프롬프트 모음
 * 
 * 사용법:
 * import { CALENDAR_IMAGE_PROMPT, ANALYSIS_IMAGE_PROMPT } from '@/lib/prompts';
 */

import { CALENDAR_IMAGE_PROMPT } from './calendar-image-prompt';
import { ANALYSIS_IMAGE_PROMPT } from './analysis-image-prompt';

export { CALENDAR_IMAGE_PROMPT, ANALYSIS_IMAGE_PROMPT };

/**
 * GPT 모델 설정
 */
export const GPT_MODEL = 'gpt-5.2'; // 사용자 요청에 따른 모델 버전

/**
 * API 호출 기본 설정
 */
export const GPT_CONFIG = {
  model: GPT_MODEL,
  temperature: 0, // 일관성을 위해 0으로 설정
  max_completion_tokens: 4096, // gpt-5.2는 max_tokens 대신 max_completion_tokens 사용
  response_format: { type: 'json_object' as const },
};

/**
 * 이미지 타입 구분
 */
export enum ImageType {
  CALENDAR = 'calendar', // 월간 캘린더 화면
  ANALYSIS = 'analysis', // 소비분석 화면
}

/**
 * 이미지 타입에 따른 프롬프트 반환
 */
export function getPromptByImageType(imageType: ImageType): string {
  switch (imageType) {
    case ImageType.CALENDAR:
      return CALENDAR_IMAGE_PROMPT;
    case ImageType.ANALYSIS:
      return ANALYSIS_IMAGE_PROMPT;
    default:
      throw new Error(`Unknown image type: ${imageType}`);
  }
}
