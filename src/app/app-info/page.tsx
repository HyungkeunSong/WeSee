'use client';

import { ChevronLeft, Heart, Code, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AppInfoPage() {
  return (
    <div className="absolute inset-0 bg-gray-50 flex flex-col overflow-hidden">
      {/* Header - Sticky 고정 및 높이 조정 (다이나믹 아일랜드 대응) */}
      <div 
        className="flex-none bg-white border-b border-gray-100 px-5 py-6 z-10"
        style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto w-full">
          <Link href="/">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">앱 정보</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content - Scrollable 영역 */}
      <div 
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
          {/* 앱 로고 및 이름 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Heart className="text-white" size={40} fill="white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">같이봄</h2>
            <p className="text-gray-600 mb-1">WeSee</p>
            <p className="text-sm text-gray-500">부부 자산 공유 앱</p>
          </div>

          {/* 버전 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">버전 정보</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="text-gray-600">현재 버전</span>
                <span className="font-semibold text-gray-900">1.0.0</span>
              </div>
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="text-gray-600">최신 버전</span>
                <span className="font-semibold text-green-600">1.0.0</span>
              </div>
              <div className="px-5 py-4 flex justify-between items-center">
                <span className="text-gray-600">빌드 번호</span>
                <span className="font-mono text-sm text-gray-900">2026.01.12</span>
              </div>
            </div>
          </div>

          {/* 앱 소개 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">앱 소개</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              <strong>같이봄(WeSee)</strong>은 개인의 자동화된 자산관리 데이터를 부부 단위로 자연스럽게 공유하고, 
              대화 가능한 월간 재무 요약으로 바꿔주는 앱입니다.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p className="text-sm text-gray-600">토스 화면 캡처로 간편한 데이터 입력</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p className="text-sm text-gray-600">AI 기반 자동 데이터 인식</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p className="text-sm text-gray-600">부부 합산 월간 재무 뷰</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <p className="text-sm text-gray-600">카테고리별 소비 분석</p>
              </div>
            </div>
          </div>

          {/* 기술 스택 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Code size={20} className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">기술 스택</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="px-5 py-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Frontend</p>
                <p className="text-sm text-gray-600">Next.js 16, React 19, TailwindCSS</p>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Backend</p>
                <p className="text-sm text-gray-600">Supabase (PostgreSQL, Auth, Storage)</p>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm font-medium text-gray-700 mb-1">AI/ML</p>
                <p className="text-sm text-gray-600">OpenAI GPT-5.2 Vision API</p>
              </div>
              <div className="px-5 py-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Deployment</p>
                <p className="text-sm text-gray-600">Vercel</p>
              </div>
            </div>
          </div>

          {/* 문의하기 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Mail size={20} className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">문의하기</h3>
            </div>
            <div className="px-5 py-4">
              <a
                href="mailto:support@wesee.app"
                className="flex items-center justify-between py-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <span>이메일 문의</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          {/* 저작권 */}
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-1">
              © 2026 WeSee. All rights reserved.
            </p>
            <p className="text-xs text-gray-400">
              Made with ❤️ for couples
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
