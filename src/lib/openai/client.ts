/**
 * OpenAI 클라이언트 설정
 */

import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
