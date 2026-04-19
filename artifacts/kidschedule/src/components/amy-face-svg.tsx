import { useEffect, useState } from "react";

interface AmyFaceSVGProps {
  size?: number;
  className?: string;
}

export function AmyFaceSVG({ size = 36, className = "" }: AmyFaceSVGProps) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const doBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
    };
    const first = setTimeout(() => {
      doBlink();
      const interval = setInterval(doBlink, 2000);
      return () => clearInterval(interval);
    }, 1200);
    return () => clearTimeout(first);
  }, []);

  const eyeRy = blink ? 0.35 : 4.2;
  const eyeIrisRy = Math.min(eyeRy, 3);
  const eyePupilRy = Math.min(eyeRy, 1.8);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <radialGradient id="amyGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C084FC" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.08" />
        </radialGradient>
        <radialGradient id="amySkin" cx="45%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FFE0B2" />
          <stop offset="100%" stopColor="#FFCC80" />
        </radialGradient>
        <linearGradient id="amyCap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4C1D95" />
          <stop offset="40%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="amyCapVisor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <radialGradient id="amyCapSheen" cx="35%" cy="20%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="amyEyeIris" cx="35%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#6B3012" />
          <stop offset="60%" stopColor="#2C1008" />
          <stop offset="100%" stopColor="#0D0400" />
        </radialGradient>
        <radialGradient id="amyCheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8A9A" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FF8A9A" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer glow ring */}
      <circle cx="32" cy="32" r="31" fill="url(#amyGlow)" />
      <circle cx="32" cy="32" r="30" stroke="#A855F7" strokeWidth="0.7" fill="none" opacity="0.45" />

      {/* Face — full round circle */}
      <circle cx="32" cy="36" r="22" fill="url(#amySkin)" />

      {/* Cap dome — covers top of face */}
      <path
        d="M 11 33 Q 11 10 32 10 Q 53 10 53 33 Z"
        fill="url(#amyCap)"
      />
      {/* Cap sheen / highlight */}
      <path
        d="M 16 28 Q 19 14 32 12 Q 44 14 47 22 Q 37 16 32 16 Q 22 16 16 28 Z"
        fill="url(#amyCapSheen)"
      />
      {/* Cap logo text — small "Ai" badge on front */}
      <rect x="26" y="25" width="12" height="6" rx="3" fill="#EC4899" opacity="0.9" />
      <text
        x="32"
        y="29.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="4.5"
        fontWeight="bold"
        fill="white"
        fontFamily="sans-serif"
        letterSpacing="0.3"
      >
        Amy
      </text>
      {/* Cap visor/brim */}
      <path
        d="M 18 33 Q 32 36 46 33 Q 46 37 32 37 Q 18 37 18 33 Z"
        fill="url(#amyCapVisor)"
      />
      <path
        d="M 18 33 Q 32 36 46 33"
        stroke="#3B0D8F"
        strokeWidth="0.8"
        fill="none"
      />

      {/* LEFT EYE */}
      {/* Sclera */}
      <ellipse cx="24" cy="40" rx="5.5" ry={eyeRy} fill="white" style={{ transition: "ry 0.09s ease" }} />
      {/* Iris */}
      <ellipse cx="24" cy="40" rx="3.8" ry={eyeIrisRy} fill="url(#amyEyeIris)" style={{ transition: "ry 0.09s ease" }} />
      {/* Pupil */}
      <ellipse cx="24" cy="40" rx="2.2" ry={eyePupilRy} fill="#0D0400" style={{ transition: "ry 0.09s ease" }} />
      {/* Highlight */}
      {!blink && <ellipse cx="22.6" cy="38.5" rx="1.2" ry="1.1" fill="white" opacity="0.9" />}

      {/* RIGHT EYE */}
      {/* Sclera */}
      <ellipse cx="40" cy="40" rx="5.5" ry={eyeRy} fill="white" style={{ transition: "ry 0.09s ease" }} />
      {/* Iris */}
      <ellipse cx="40" cy="40" rx="3.8" ry={eyeIrisRy} fill="url(#amyEyeIris)" style={{ transition: "ry 0.09s ease" }} />
      {/* Pupil */}
      <ellipse cx="40" cy="40" rx="2.2" ry={eyePupilRy} fill="#0D0400" style={{ transition: "ry 0.09s ease" }} />
      {/* Highlight */}
      {!blink && <ellipse cx="38.6" cy="38.5" rx="1.2" ry="1.1" fill="white" opacity="0.9" />}

      {/* Upper eyelashes */}
      {!blink && (
        <>
          <line x1="19.5" y1="35.5" x2="18" y2="33.5" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="22" y1="34.7" x2="21.2" y2="32.5" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="24.5" y1="34.5" x2="24.5" y2="32" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="27" y1="34.7" x2="27.8" y2="32.5" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="28.5" y1="35.5" x2="30" y2="33.5" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="35.5" y1="35.5" x2="34" y2="33.5" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="37.5" y1="34.7" x2="36.7" y2="32.5" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="40" y1="34.5" x2="40" y2="32" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="42.5" y1="34.7" x2="43.2" y2="32.5" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="44.5" y1="35.5" x2="46" y2="33.5" stroke="#2C1008" strokeWidth="1.1" strokeLinecap="round" />
        </>
      )}

      {/* Blush cheeks */}
      <ellipse cx="17" cy="45" rx="5" ry="3.2" fill="url(#amyCheek)" />
      <ellipse cx="47" cy="45" rx="5" ry="3.2" fill="url(#amyCheek)" />

      {/* Nose — two subtle dots */}
      <ellipse cx="30.5" cy="45.5" rx="0.9" ry="0.75" fill="#D4956A" opacity="0.55" />
      <ellipse cx="33.5" cy="45.5" rx="0.9" ry="0.75" fill="#D4956A" opacity="0.55" />

      {/* Smile */}
      <path
        d="M 24 50 Q 32 57 40 50"
        stroke="#8B4513"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Teeth */}
      <path d="M 25.5 50.2 Q 32 54 38.5 50.2" fill="white" opacity="0.7" stroke="none" />

      {/* Gold earrings */}
      <circle cx="10.8" cy="43" r="1.8" fill="#FFD700" />
      <circle cx="10.8" cy="43" r="0.9" fill="#FFF59D" />
      <circle cx="53.2" cy="43" r="1.8" fill="#FFD700" />
      <circle cx="53.2" cy="43" r="0.9" fill="#FFF59D" />
    </svg>
  );
}
