'use client';

import { useState, useEffect, useRef } from 'react';
import { format, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Upload, X, Calendar, PieChart, ChevronDown, Check, Loader2 } from 'lucide-react';
import { compressImage, formatFileSize, type CompressedImage } from '@/lib/image-utils';

interface ImageUploadSlotProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  image: File | null;
  compressInfo?: CompressedImage | null;
  onUpload: (file: File, compressed: CompressedImage) => void;
  onRemove: () => void;
  isRequired?: boolean;
  guideText: string;
  isCompressing?: boolean;
}

function ImageUploadSlot({
  title,
  description,
  icon,
  image,
  compressInfo,
  onUpload,
  onRemove,
  isRequired = false,
  guideText,
  isCompressing = false,
}: ImageUploadSlotProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        // 이미지 압축
        const compressed = await compressImage(file);
        onUpload(file, compressed);
      } catch (err) {
        console.error('이미지 압축 실패:', err);
        // 압축 실패 시 원본 사용
        onUpload(file, {
          file,
          originalSize: file.size,
          compressedSize: file.size,
          width: 0,
          height: 0,
        });
      }
    }
  };

  const handleRemove = () => {
    onRemove();
    setPreview(null);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-gray-700">{icon}</div>
          <div>
            <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{guideText}</p>
          </div>
        </div>
      </div>

      {/* 업로드 영역 */}
      <div className="p-4">
        {!image ? (
          <label className="flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600">이미지 선택</p>
            <p className="text-xs text-gray-400 mt-1">탭하여 갤러리에서 선택</p>
          </label>
        ) : (
          <div className="relative">
            <div className="relative h-40 bg-gray-100 rounded-xl overflow-hidden">
              {preview && (
                <img
                  src={preview}
                  alt="업로드된 이미지"
                  className="w-full h-full object-cover"
                />
              )}
              {isCompressing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 hover:bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <X size={18} />
            </button>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">
                준비 완료
                {compressInfo && compressInfo.originalSize > compressInfo.compressedSize && (
                  <span className="text-gray-400 ml-1">
                    ({formatFileSize(compressInfo.originalSize)} → {formatFileSize(compressInfo.compressedSize)})
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 단계별 진행 상태 컴포넌트
interface ProcessStepProps {
  step: number;
  currentStep: number;
  label: string;
  isError?: boolean;
}

function ProcessStep({ step, currentStep, label, isError }: ProcessStepProps) {
  const isCompleted = currentStep > step;
  const isActive = currentStep === step;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
          isError && isActive
            ? 'bg-red-100 text-red-600 border-2 border-red-300'
            : isCompleted
            ? 'bg-green-500 text-white'
            : isActive
            ? 'bg-[#3182F6] text-white animate-pulse'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        {isCompleted ? <Check size={14} /> : isActive && !isError ? <Loader2 size={14} className="animate-spin" /> : step}
      </div>
      <span
        className={`text-sm transition-colors ${
          isError && isActive
            ? 'text-red-600 font-medium'
            : isCompleted
            ? 'text-gray-900 font-medium'
            : isActive
            ? 'text-gray-900 font-medium'
            : 'text-gray-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function UploadPage() {
  const today = new Date();
  
  // 초기값은 항상 today로 설정 (SSR/CSR 일치)
  const [selectedMonth, setSelectedMonth] = useState<Date>(today);
  const [calendarImage, setCalendarImage] = useState<File | null>(null);
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [calendarCompressInfo, setCalendarCompressInfo] = useState<CompressedImage | null>(null);
  const [categoryCompressInfo, setCategoryCompressInfo] = useState<CompressedImage | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessStep, setCurrentProcessStep] = useState(0);
  const [error, setError] = useState<string>('');
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // 클라이언트에서 마운트 후 localStorage에서 월 복원
  useEffect(() => {
    const savedMonth = localStorage.getItem('currentMonth');
    if (savedMonth) {
      const [year, month] = savedMonth.split('-').map(Number);
      const savedDate = new Date(year, month - 1, 1);
      setSelectedMonth(savedDate);
    }
  }, []);

  // 월 선택 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
    };

    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthPicker]);

  // 지난 24개월 생성 (2년)
  const availableMonths = Array.from({ length: 24 }, (_, i) => {
    return subMonths(today, i);
  });

  const canProcess = calendarImage !== null && categoryImage !== null; // 두 이미지 모두 필수
  
  // 선택된 월의 숫자 추출 (1-12)
  const selectedMonthNumber = selectedMonth.getMonth() + 1;

  const handleProcess = async () => {
    if (!canProcess || isProcessing) return;
    
    setIsProcessing(true);
    setError('');
    setCurrentProcessStep(1);
    
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;

      // 1단계: 이미지 업로드
      const uploadedImages: Array<{ url: string; type: 'calendar' | 'analysis' }> = [];

      // 캘린더 이미지 업로드 (압축된 파일 사용)
      if (calendarCompressInfo) {
        const formData = new FormData();
        formData.append('file', calendarCompressInfo.file);
        formData.append('year', year.toString());
        formData.append('month', month.toString());
        formData.append('type', 'calendar');

        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({ error: '알 수 없는 오류' }));
          
          if (uploadRes.status === 401) {
            alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/login';
            return;
          }
          
          throw new Error(`캘린더 이미지 업로드 실패: ${errorData.error || uploadRes.statusText}`);
        }

        const uploadData = await uploadRes.json();
        uploadedImages.push({ url: uploadData.url, type: 'calendar' });
      }

      // 카테고리 이미지 업로드 (압축된 파일 사용)
      if (categoryCompressInfo) {
        const formData = new FormData();
        formData.append('file', categoryCompressInfo.file);
        formData.append('year', year.toString());
        formData.append('month', month.toString());
        formData.append('type', 'analysis');

        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({ error: '알 수 없는 오류' }));
          
          if (uploadRes.status === 401) {
            alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
            window.location.href = '/login';
            return;
          }
          
          throw new Error(`소비분석 이미지 업로드 실패: ${errorData.error || uploadRes.statusText}`);
        }

        const uploadData = await uploadRes.json();
        uploadedImages.push({ url: uploadData.url, type: 'analysis' });
      }

      // 2단계: AI 분석 시작
      setCurrentProcessStep(2);
      
      const processRes = await fetch('/api/process-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: uploadedImages,
          year,
          month,
        }),
      });

      if (!processRes.ok) {
        const errorData = await processRes.json();
        throw new Error(errorData.details || errorData.error || 'AI 분석 실패');
      }

      // 3단계: 데이터 저장 완료
      setCurrentProcessStep(3);

      // 4단계: 완료
      setCurrentProcessStep(4);
      
      // 선택된 월을 localStorage에 저장
      localStorage.setItem('currentMonth', `${year}-${month}`);
      
      // 홈 화면으로 이동
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (err) {
      console.error('처리 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col overscroll-none">
      {/* Header - flex-none으로 고정 */}
      <div className="flex-none bg-white border-b border-gray-100 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="h-[90px] max-w-[430px] mx-auto px-4 flex flex-col justify-end pb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            데이터 업로드
          </h1>
        </div>
      </div>

      {/* 컨텐츠 - 여기만 스크롤 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4 overscroll-contain" style={{ paddingBottom: 'calc(46px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-lg mx-auto w-full space-y-4">
          {/* 월 선택 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div ref={monthPickerRef} className="relative">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 transition-colors ${
                  showMonthPicker 
                    ? 'rounded-t-xl' 
                    : 'rounded-xl'
                }`}
              >
                <span className="font-semibold text-gray-900">
                  {format(selectedMonth, 'yyyy년 M월', { locale: ko })}
                </span>
                <ChevronDown
                  className={`text-gray-500 transition-transform ${
                    showMonthPicker ? 'rotate-180' : ''
                  }`}
                  size={20}
                />
              </button>

              {/* 월 선택 드롭다운 - absolute positioning */}
              {showMonthPicker && (
                <div className="absolute left-0 right-0 top-[calc(100%-2px)] bg-white border-2 border-t border-gray-200 rounded-b-xl shadow-lg max-h-60 overflow-y-auto z-50">
                  {availableMonths.map((month) => (
                    <button
                      key={month.toISOString()}
                      onClick={() => {
                        setSelectedMonth(month);
                        setShowMonthPicker(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        format(month, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM')
                          ? 'bg-[#EBF4FF] text-[#3182F6] font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {format(month, 'yyyy년 M월', { locale: ko })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 이미지 업로드 슬롯 1 */}
          <ImageUploadSlot
            title="월간 수입·지출 캘린더"
            description="토스의 월간 캘린더 화면"
            icon={<Calendar size={20} />}
            image={calendarImage}
            compressInfo={calendarCompressInfo}
            onUpload={(file, compressed) => {
              setCalendarImage(file);
              setCalendarCompressInfo(compressed);
            }}
            onRemove={() => {
              setCalendarImage(null);
              setCalendarCompressInfo(null);
            }}
            isRequired={true}
            guideText={`토스 홈 화면 > ${selectedMonthNumber}월에 쓴 돈 > 내역 더 보기`}
          />

          {/* 이미지 업로드 슬롯 2 */}
          <ImageUploadSlot
            title="카테고리별 소비"
            description="토스의 카테고리별 소비 화면"
            icon={<PieChart size={20} />}
            image={categoryImage}
            compressInfo={categoryCompressInfo}
            onUpload={(file, compressed) => {
              setCategoryImage(file);
              setCategoryCompressInfo(compressed);
            }}
            onRemove={() => {
              setCategoryImage(null);
              setCategoryCompressInfo(null);
            }}
            isRequired={true}
            guideText={`토스 홈 > ${selectedMonthNumber}월에 쓴 돈 > 카테고리별 소비`}
          />

          {/* 처리 버튼 또는 진행 상태 */}
          {!isProcessing ? (
            <button
              onClick={handleProcess}
              disabled={!canProcess}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors ${
                canProcess
                  ? 'bg-[#3182F6] hover:bg-[#1C6DD0] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              데이터 인식 시작
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="space-y-4">
                <ProcessStep step={1} currentStep={currentProcessStep} label="이미지 업로드" isError={!!error && currentProcessStep === 1} />
                <ProcessStep step={2} currentStep={currentProcessStep} label="AI 이미지 분석" isError={!!error && currentProcessStep === 2} />
                <ProcessStep step={3} currentStep={currentProcessStep} label="데이터 저장" isError={!!error && currentProcessStep === 3} />
                <ProcessStep step={4} currentStep={currentProcessStep} label="완료" isError={!!error && currentProcessStep === 4} />
              </div>
              {currentProcessStep === 4 && !error && (
                <p className="text-sm text-green-600 font-medium mt-4 text-center">
                  잠시 후 홈 화면으로 이동합니다...
                </p>
              )}
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                onClick={() => {
                  setError('');
                  setIsProcessing(false);
                  setCurrentProcessStep(0);
                }}
                className="mt-2 text-sm text-red-500 underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 재업로드 안내 */}
          {(calendarImage || categoryImage) && !isProcessing && (
            <div className="text-center text-xs text-gray-500 pb-4">
              선택한 월에 이미 데이터가 있다면 새로운 데이터로 업데이트됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
