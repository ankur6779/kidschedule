import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";

const LETTERS = [
  { char: "A", color: "#FF4757", glow: "#FF6B7A", shadow: "#CC0020" },
  { char: "m", color: "#FF6B35", glow: "#FF8C5A", shadow: "#CC4400" },
  { char: "y", color: "#FFC300", glow: "#FFD740", shadow: "#CC9900" },
  { char: "N", color: "#2ECC71", glow: "#58D68D", shadow: "#1A9950" },
  { char: "e", color: "#3498DB", glow: "#5DADE2", shadow: "#1A6FA0" },
  { char: "s", color: "#9B59B6", glow: "#BB8FCE", shadow: "#6C3483" },
  { char: "t", color: "#E91E8C", glow: "#F06AB5", shadow: "#B5006A" },
];

const AI_LETTERS = [
  { char: " ", color: "transparent", glow: "transparent", shadow: "transparent" },
  { char: "A", color: "#00BCD4", glow: "#40D6E8", shadow: "#00838F" },
  { char: "I", color: "#7C4DFF", glow: "#B388FF", shadow: "#4615D4" },
];

const SPRINKLE_COLORS = [
  "#FF4757", "#FF6B35", "#FFC300", "#2ECC71", "#3498DB", "#9B59B6", "#E91E8C",
];

function Sprinkle({ x, y, color, rotation, delay }: { x: number; y: number; color: string; rotation: number; delay: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: Math.random() > 0.5 ? "6px" : "3px",
        height: Math.random() > 0.5 ? "2px" : "6px",
        backgroundColor: color,
        rotate: rotation,
        boxShadow: `0 0 4px ${color}`,
      }}
      animate={{
        y: [0, -6, 0, 4, 0],
        rotate: [rotation, rotation + 20, rotation],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

const SPRINKLES = Array.from({ length: 22 }, (_, i) => ({
  x: 5 + (i / 22) * 90 + (Math.sin(i * 1.7) * 4),
  y: 10 + Math.abs(Math.sin(i * 0.9) * 70),
  color: SPRINKLE_COLORS[i % SPRINKLE_COLORS.length],
  rotation: (i * 37) % 180,
  delay: i * 0.15,
}));

interface LetterProps {
  char: string;
  color: string;
  glow: string;
  shadow: string;
  index: number;
  isDark: boolean;
  isAI?: boolean;
}

function AnimatedLetter({ char, color, glow, shadow, index, isDark, isAI = false }: LetterProps) {
  return (
    <motion.span
      className="relative inline-block select-none"
      style={{
        color,
        fontFamily: "'Nunito', 'Fredoka One', system-ui, sans-serif",
        fontWeight: 900,
        fontSize: isAI ? "clamp(1.6rem, 4vw, 3rem)" : "clamp(2.4rem, 6vw, 5rem)",
        letterSpacing: "-0.01em",
        textShadow: isDark
          ? `0 0 20px ${glow}, 0 0 40px ${color}66, 2px 4px 0 ${shadow}, 4px 6px 12px rgba(0,0,0,0.5)`
          : `2px 3px 0 ${shadow}, 4px 6px 12px rgba(0,0,0,0.18), 0 0 0 transparent`,
        filter: isDark ? `drop-shadow(0 0 8px ${glow}88)` : "none",
        WebkitTextStroke: isDark ? `0px transparent` : `0.5px ${shadow}44`,
        lineHeight: 1,
        cursor: "default",
      }}
      initial={{ y: 20, opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        delay: index * 0.07,
        type: "spring",
        stiffness: 300,
        damping: 18,
      }}
      whileHover={{
        scale: 1.25,
        rotate: [-3, 3, -2, 0],
        textShadow: isDark
          ? `0 0 30px ${glow}, 0 0 60px ${color}88, 2px 4px 0 ${shadow}, 4px 8px 16px rgba(0,0,0,0.6)`
          : `2px 4px 0 ${shadow}, 6px 10px 20px rgba(0,0,0,0.22)`,
        filter: `drop-shadow(0 0 12px ${glow}cc)`,
        transition: { duration: 0.18, rotate: { repeat: 0, duration: 0.3 } },
      }}
    >
      {/* Glossy highlight overlay */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 40%, transparent 60%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          mixBlendMode: "overlay",
        }}
      >
        {char}
      </span>
      {char}
    </motion.span>
  );
}

function DrippingEffect({ color }: { color: string }) {
  return (
    <motion.div
      className="absolute bottom-0 w-[3px] rounded-full"
      style={{ backgroundColor: color, left: "50%", transformOrigin: "top" }}
      initial={{ scaleY: 0, opacity: 0 }}
      animate={{ scaleY: [0, 1, 0.9, 1], opacity: [0, 0.8, 0.6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
    />
  );
}

export function AmyNestLogo({ forceDark }: { forceDark?: boolean }) {
  const [isDark, setIsDark] = useState(
    forceDark ?? window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (forceDark !== undefined) { setIsDark(forceDark); return; }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [forceDark]);

  const floatY = useMotionValue(0);

  return (
    <motion.div
      className="relative inline-flex flex-col items-center"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Blurred glow behind full text */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(155,89,182,0.3) 0%, rgba(52,152,219,0.15) 40%, transparent 70%)"
            : "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(155,89,182,0.12) 0%, rgba(52,152,219,0.08) 40%, transparent 70%)",
          filter: "blur(18px)",
          borderRadius: "50%",
          transform: "scale(1.4)",
          zIndex: 0,
        }}
      />

      {/* Sprinkles container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {SPRINKLES.map((s, i) => (
          <Sprinkle key={i} {...s} />
        ))}
      </div>

      {/* Logo text */}
      <div className="relative flex items-baseline gap-[0.03em]" style={{ zIndex: 2 }}>
        {/* AmyNest */}
        <div className="flex items-baseline">
          {LETTERS.map((l, i) => (
            <AnimatedLetter key={i} {...l} index={i} isDark={isDark} />
          ))}
        </div>
        {/* AI badge */}
        <motion.div
          className="flex items-center ml-1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: LETTERS.length * 0.07 + 0.1, type: "spring", stiffness: 260 }}
        >
          <div
            className="flex items-center px-2 py-0.5 rounded-full ml-1"
            style={{
              background: isDark
                ? "linear-gradient(135deg, #7C4DFF44, #00BCD444)"
                : "linear-gradient(135deg, #E8D5FF, #B3EBF2)",
              border: isDark ? "1px solid #9B59B688" : "1px solid #C8A8FF",
              boxShadow: isDark
                ? "0 0 16px #7C4DFF66, inset 0 1px 0 rgba(255,255,255,0.1)"
                : "0 2px 8px rgba(124,77,255,0.18), inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            {AI_LETTERS.slice(1).map((l, i) => (
              <AnimatedLetter key={i} {...l} index={LETTERS.length + 1 + i} isDark={isDark} isAI />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Subtle tagline */}
      <motion.p
        className="relative text-center mt-1"
        style={{
          fontFamily: "'Nunito', system-ui, sans-serif",
          fontWeight: 600,
          fontSize: "clamp(0.65rem, 1.4vw, 0.85rem)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: isDark ? "rgba(255,255,255,0.45)" : "rgba(80,40,120,0.5)",
          zIndex: 2,
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        Smart Parenting · Powered by AI
      </motion.p>
    </motion.div>
  );
}

export default function Preview() {
  return (
    <div className="min-h-screen grid grid-rows-2">
      {/* Dark mode */}
      <div
        className="flex items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B0B1A 0%, #1A0B2E 50%, #0D1B2A 100%)" }}
      >
        <div className="absolute top-4 left-6 text-xs text-white/30 font-mono">Dark Mode</div>
        <AmyNestLogo forceDark={true} />
      </div>
      {/* Light mode */}
      <div
        className="flex items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F8F4FF 0%, #FFF0F8 50%, #F0F8FF 100%)" }}
      >
        <div className="absolute top-4 left-6 text-xs text-purple-400/60 font-mono">Light Mode</div>
        <AmyNestLogo forceDark={false} />
      </div>
    </div>
  );
}
