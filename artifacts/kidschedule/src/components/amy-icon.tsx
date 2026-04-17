interface AmyIconProps {
  size?: number;
  className?: string;
  bounce?: boolean;
}

export function AmyIcon({ size = 36, className = "", bounce = false }: AmyIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${bounce ? "amy-bounce" : ""} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Amy"
      >
        <defs>
          <radialGradient id="amyFace" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#FFF4E6" />
            <stop offset="55%" stopColor="#FFE0C2" />
            <stop offset="100%" stopColor="#F5C8A6" />
          </radialGradient>
          <linearGradient id="amyHair" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#C7A6FF" />
            <stop offset="100%" stopColor="#A98BFF" />
          </linearGradient>
        </defs>

        {/* Soft glow */}
        <circle cx="32" cy="34" r="28" fill="#FFE9F1" opacity="0.55" />

        {/* Hair / hood top */}
        <path d="M10 32 Q14 8 32 8 Q50 8 54 32 Q54 22 32 18 Q10 22 10 32 Z" fill="url(#amyHair)" />

        {/* Face */}
        <circle cx="32" cy="36" r="20" fill="url(#amyFace)" />

        {/* Cheeks */}
        <ellipse cx="20" cy="40" rx="3.4" ry="2.4" fill="#FFB4C8" opacity="0.75" />
        <ellipse cx="44" cy="40" rx="3.4" ry="2.4" fill="#FFB4C8" opacity="0.75" />

        {/* Eyes */}
        <g className="amy-eyes">
          <ellipse cx="24" cy="33" rx="3.4" ry="4" fill="#2A2245" />
          <ellipse cx="40" cy="33" rx="3.4" ry="4" fill="#2A2245" />
          {/* Eye sparkle */}
          <circle cx="25.4" cy="31.5" r="1.1" fill="#FFFFFF" />
          <circle cx="41.4" cy="31.5" r="1.1" fill="#FFFFFF" />
        </g>

        {/* Smile */}
        <path
          d="M25 43 Q32 49 39 43"
          stroke="#7A4A2C"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Tiny leaf antenna */}
        <path d="M32 8 Q32 3 36 4 Q35 8 32 9 Z" fill="#7BCFA9" />
      </svg>
    </span>
  );
}
