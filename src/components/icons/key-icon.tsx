interface KeyIconProps {
  className?: string;
  size?: number;
}

export function KeyIcon({ className = "", size = 48 }: KeyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 열쇠 몸통 */}
      <path
        d="M44 20 C50 20, 54 24, 54 30 C54 36, 50 40, 44 40 L28 40 L28 36 L24 36 L24 40 L20 40 L20 44 L24 44 L24 48 L28 48 L28 44 L28 40 L44 40 C44 40, 44 20, 44 20 Z"
        fill="url(#keyGradient)"
        stroke="#A855F7"
        strokeWidth="2"
      />
      
      {/* 열쇠 구멍 */}
      <circle cx="44" cy="30" r="4" fill="#FFFFFF" />
      
      {/* 그라디언트 정의 */}
      <defs>
        <linearGradient id="keyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
