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
      setTimeout(() => setBlink(false), 140);
    };
    // first blink after 1.5s, then every ~2.2s
    const t = setTimeout(() => {
      doBlink();
      const interval = setInterval(doBlink, 2200);
      return () => clearInterval(interval);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const eyeRy = blink ? 0.4 : 4;

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
        <radialGradient id="amyBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C084FC" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="amySkin" cx="45%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#FFE0B2" />
          <stop offset="100%" stopColor="#FFCC80" />
        </radialGradient>
        <radialGradient id="amyHair" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#3E1C0A" />
          <stop offset="100%" stopColor="#150700" />
        </radialGradient>
        <radialGradient id="amyEye" cx="35%" cy="30%" r="55%">
          <stop offset="0%" stopColor="#6B3012" />
          <stop offset="60%" stopColor="#2C1008" />
          <stop offset="100%" stopColor="#0D0400" />
        </radialGradient>
        <radialGradient id="amyPupil" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0D0400" />
          <stop offset="100%" stopColor="#1A0800" />
        </radialGradient>
        <radialGradient id="amyCheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8A9A" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FF8A9A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="amyBand" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#BDBDBD" />
          <stop offset="50%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#BDBDBD" />
        </linearGradient>
      </defs>

      {/* Outer glow ring */}
      <circle cx="32" cy="32" r="31" fill="url(#amyBg)" />
      <circle cx="32" cy="32" r="30" stroke="#A855F7" strokeWidth="0.8" fill="none" opacity="0.5" />

      {/* Neck */}
      <ellipse cx="32" cy="57" rx="7" ry="5" fill="url(#amySkin)" />

      {/* Face */}
      <ellipse cx="32" cy="38" rx="18" ry="19" fill="url(#amySkin)" />

      {/* Hair — back layer */}
      <ellipse cx="32" cy="25" rx="19" ry="16" fill="url(#amyHair)" />
      {/* Hair — volume top */}
      <ellipse cx="32" cy="18" rx="17" ry="13" fill="url(#amyHair)" />
      {/* Hair — side curls */}
      <ellipse cx="15" cy="36" rx="5.5" ry="11" fill="url(#amyHair)" />
      <ellipse cx="49" cy="36" rx="5.5" ry="11" fill="url(#amyHair)" />
      {/* Hair — front wave */}
      <path
        d="M 14 26 Q 20 19 32 17 Q 44 19 50 26"
        stroke="#2C1008"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Headband */}
      <path
        d="M 13.5 24 Q 32 13 50.5 24"
        stroke="url(#amyBand)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Hair clips — colorful flowers/stars */}
      {/* Green clip */}
      <circle cx="18" cy="21" r="3.5" fill="#43A047" />
      <circle cx="18" cy="21" r="2" fill="#66BB6A" />
      <circle cx="18" cy="21" r="0.8" fill="#A5D6A7" />
      {/* Yellow clip */}
      <circle cx="24.5" cy="17.5" r="3.5" fill="#F9A825" />
      <circle cx="24.5" cy="17.5" r="2" fill="#FFD54F" />
      <circle cx="24.5" cy="17.5" r="0.8" fill="#FFF9C4" />
      {/* Pink clip */}
      <circle cx="31.5" cy="15.5" r="3.5" fill="#E91E8C" />
      <circle cx="31.5" cy="15.5" r="2" fill="#F48FB1" />
      <circle cx="31.5" cy="15.5" r="0.8" fill="#FCE4EC" />
      {/* Orange clip */}
      <circle cx="38.5" cy="17.5" r="3.5" fill="#E64A19" />
      <circle cx="38.5" cy="17.5" r="2" fill="#FF7043" />
      <circle cx="38.5" cy="17.5" r="0.8" fill="#FFCCBC" />
      {/* Purple clip */}
      <circle cx="45" cy="21" r="3.5" fill="#7B1FA2" />
      <circle cx="45" cy="21" r="2" fill="#CE93D8" />
      <circle cx="45" cy="21" r="0.8" fill="#F3E5F5" />

      {/* Eyebrows */}
      <path
        d="M 20 31 Q 24 28.5 28 30"
        stroke="#3E1C0A"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 36 30 Q 40 28.5 44 31"
        stroke="#3E1C0A"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Left eye whites */}
      <ellipse cx="24" cy="36.5" rx="5" ry={eyeRy} fill="white" style={{ transition: "ry 0.08s ease" }} />
      {/* Left iris */}
      <ellipse cx="24" cy="36.5" rx="3.5" ry={Math.min(eyeRy, 3.5)} fill="url(#amyEye)" style={{ transition: "ry 0.08s ease" }} />
      {/* Left pupil */}
      <ellipse cx="24" cy="36.5" rx="2" ry={Math.min(eyeRy, 2)} fill="url(#amyPupil)" style={{ transition: "ry 0.08s ease" }} />
      {/* Left eye highlight */}
      {!blink && <ellipse cx="22.8" cy="35.2" rx="1.1" ry="1" fill="white" opacity="0.9" />}

      {/* Right eye whites */}
      <ellipse cx="40" cy="36.5" rx="5" ry={eyeRy} fill="white" style={{ transition: "ry 0.08s ease" }} />
      {/* Right iris */}
      <ellipse cx="40" cy="36.5" rx="3.5" ry={Math.min(eyeRy, 3.5)} fill="url(#amyEye)" style={{ transition: "ry 0.08s ease" }} />
      {/* Right pupil */}
      <ellipse cx="40" cy="36.5" rx="2" ry={Math.min(eyeRy, 2)} fill="url(#amyPupil)" style={{ transition: "ry 0.08s ease" }} />
      {/* Right eye highlight */}
      {!blink && <ellipse cx="38.8" cy="35.2" rx="1.1" ry="1" fill="white" opacity="0.9" />}

      {/* Upper eyelashes — left */}
      {!blink && (
        <>
          <line x1="20" y1="31.8" x2="18.5" y2="29.5" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="22" y1="31" x2="21.5" y2="28.5" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="24" y1="30.7" x2="24" y2="28" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="26" y1="31" x2="26.5" y2="28.5" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="28" y1="31.8" x2="29.5" y2="29.5" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
          {/* Upper eyelashes — right */}
          <line x1="36" y1="31.8" x2="34.5" y2="29.5" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="38" y1="31" x2="37.5" y2="28.5" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="40" y1="30.7" x2="40" y2="28" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="42" y1="31" x2="42.5" y2="28.5" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="44" y1="31.8" x2="45.5" y2="29.5" stroke="#2C1008" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}

      {/* Blush cheeks */}
      <ellipse cx="18" cy="42" rx="5.5" ry="3.5" fill="url(#amyCheek)" />
      <ellipse cx="46" cy="42" rx="5.5" ry="3.5" fill="url(#amyCheek)" />

      {/* Nose — subtle dots */}
      <ellipse cx="30" cy="41" rx="1" ry="0.8" fill="#D4956A" opacity="0.6" />
      <ellipse cx="34" cy="41" rx="1" ry="0.8" fill="#D4956A" opacity="0.6" />

      {/* Smile with teeth */}
      <path
        d="M 23 46 Q 32 53 41 46"
        stroke="#8B4513"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Teeth hint */}
      <path
        d="M 25 46.5 Q 32 50 39 46.5"
        stroke="none"
        fill="white"
        opacity="0.75"
      />

      {/* Gold earrings */}
      <circle cx="13.5" cy="42" r="2" fill="#FFD700" />
      <circle cx="13.5" cy="42" r="1" fill="#FFF176" />
      <circle cx="50.5" cy="42" r="2" fill="#FFD700" />
      <circle cx="50.5" cy="42" r="1" fill="#FFF176" />
    </svg>
  );
}
