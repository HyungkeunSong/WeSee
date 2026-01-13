"use client";

import { useState } from "react";
import { ChevronLeft, User, Save } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [partner1Name, setPartner1Name] = useState("형근");
  const [partner2Name, setPartner2Name] = useState("호경");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Supabase에 저장
    await new Promise(resolve => setTimeout(resolve, 500)); // 임시 딜레이
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
          </Link>
          <h1 className="text-xl font-bold">설정</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6">
        {/* 프로필 섹션 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">프로필 설정</h2>
          
          {/* 파트너 1 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              파트너 1
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700 font-semibold text-lg">
                  {partner1Name.charAt(0)}
                </span>
              </div>
              <input
                type="text"
                value={partner1Name}
                onChange={(e) => setPartner1Name(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="이름을 입력하세요"
                maxLength={10}
              />
            </div>
          </div>

          {/* 파트너 2 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              파트너 2
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-700 font-semibold text-lg">
                  {partner2Name.charAt(0)}
                </span>
              </div>
              <input
                type="text"
                value={partner2Name}
                onChange={(e) => setPartner2Name(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="이름을 입력하세요"
                maxLength={10}
              />
            </div>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
              isSaving
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            <Save size={20} />
            {isSaving ? "저장 중..." : "저장하기"}
          </button>
        </div>

        {/* 앱 정보 섹션 */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">앱 정보</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-600">버전</span>
              <span className="text-sm font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-600">앱 이름</span>
              <span className="text-sm font-medium text-gray-900">같이봄 (WeSee)</span>
            </div>
          </div>
        </div>

        {/* 로그아웃 (나중에 구현) */}
        <div className="border-t border-gray-100 pt-6 mt-6">
          <button className="w-full py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-colors">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
