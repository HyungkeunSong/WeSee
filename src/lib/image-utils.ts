/**
 * 이미지 리사이즈 및 압축 유틸리티
 * 
 * GPT Vision API는 고해상도 이미지를 처리할 수 있지만,
 * 네트워크 업로드 시간과 API 처리 시간을 줄이기 위해 이미지를 최적화합니다.
 */

export interface CompressedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

/**
 * 이미지를 리사이즈하고 압축합니다.
 * 
 * @param file 원본 이미지 파일
 * @param maxWidth 최대 너비 (기본값: 1920px)
 * @param maxHeight 최대 높이 (기본값: 1920px)
 * @param quality 압축 품질 0-1 (기본값: 0.85)
 * @returns 압축된 이미지 정보
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context를 생성할 수 없습니다.'));
      return;
    }

    img.onload = () => {
      // 원본 크기
      let { width, height } = img;
      const originalSize = file.size;

      // 비율 유지하며 리사이즈
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // 캔버스 크기 설정
      canvas.width = width;
      canvas.height = height;

      // 고품질 리사이즈를 위한 설정
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);

      // Blob으로 변환 (JPEG 포맷)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('이미지 압축에 실패했습니다.'));
            return;
          }

          // 압축된 파일 생성
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg' }
          );

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize: blob.size,
            width,
            height,
          });
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };

    // 파일 읽기
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 파일 크기를 사람이 읽기 좋은 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
