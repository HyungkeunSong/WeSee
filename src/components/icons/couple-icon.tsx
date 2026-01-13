interface CoupleIconProps {
  className?: string;
  size?: number;
}

export function CoupleIcon({ className = "", size = 48 }: CoupleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 여성 (왼쪽) */}
      <circle cx="22" cy="20" r="8" fill="#FF6B9D" />
      <path
        d="M22 30 C18 30, 12 32, 12 38 L12 50 C12 52, 14 54, 16 54 L28 54 C30 54, 32 52, 32 50 L32 38 C32 32, 26 30, 22 30 Z"
        fill="#FF6B9D"
      />
      
      {/* 남성 (오른쪽) */}
      <circle cx="42" cy="20" r="8" fill="#4A90E2" />
      <path
        d="M42 30 C38 30, 32 32, 32 38 L32 50 C32 52, 34 54, 36 54 L48 54 C50 54, 52 52, 52 50 L52 38 C52 32, 46 30, 42 30 Z"
        fill="#4A90E2"
      />
      
      {/* 하트 (중앙) */}
      <path
        d="M32 25 C30 22, 26 22, 24 24 C22 26, 22 29, 24 31 L32 38 L40 31 C42 29, 42 26, 40 24 C38 22, 34 22, 32 25 Z"
        fill="#FF4B7A"
        opacity="0.9"
      />
    </svg>
  );
}
