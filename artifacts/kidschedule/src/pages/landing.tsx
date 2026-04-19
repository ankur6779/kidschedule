import { Link } from "wouter";
import {
  ArrowRight,
  Sparkles,
  Brain,
  Calendar,
  LayoutGrid,
  MessageCircle,
  Zap,
  CheckCircle2,
  Flame,
  Smartphone,
  Moon,
  EarOff,
  Utensils,
  Target,
  ListChecks,
  HelpCircle,
  ShieldCheck,
  BookOpen,
  Microscope,
  TrendingUp,
  Video,
  Star,
  Users,
  Lightbulb,
  Puzzle,
  Palette,
  FileText,
  Baby,
  GraduationCap,
  Activity,
  Heart,
  Award,
  ChevronRight,
  Play,
  Clock,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import logoImg from "@assets/ChatGPT_Image_Apr_19,_2026,_02_10_25_PM_1776624219075.png";
import heroImg from "@assets/ChatGPT_Image_Apr_19,_2026,_02_10_25_PM_1776588039438.png";
import { useTranslation } from "react-i18next";

const COACH_HIGHLIGHT_KEYS = [
  "landing.highlight_1",
  "landing.highlight_2",
  "landing.highlight_3",
  "landing.highlight_4",
];

const PROBLEMS = [
  { icon: Flame, labelKey: "landing.problem_tantrums", color: "#EF4444" },
  { icon: Smartphone, labelKey: "landing.problem_screen", color: "#06B6D4" },
  { icon: Moon, labelKey: "landing.problem_sleep", color: "#6366F1" },
  { icon: EarOff, labelKey: "landing.problem_listening", color: "#F97316" },
  { icon: Utensils, labelKey: "landing.problem_eating", color: "#EC4899" },
  { icon: Target, labelKey: "landing.problem_focus", color: "#A855F7" },
];

const SECONDARY_FEATURES = [
  {
    icon: Calendar,
    titleKey: "landing.feature_routine_title",
    descKey: "landing.feature_routine_desc",
    gradient: "linear-gradient(135deg,#06B6D4,#3B82F6)",
  },
  {
    icon: LayoutGrid,
    titleKey: "landing.feature_hub_title",
    descKey: "landing.feature_hub_desc",
    gradient: "linear-gradient(135deg,#EC4899,#F97316)",
  },
  {
    icon: Zap,
    titleKey: "landing.feature_ai_title",
    descKey: "landing.feature_ai_desc",
    gradient: "linear-gradient(135deg,#FFD166,#F97316)",
  },
];

const STEPS = [
  { icon: Target, titleKey: "landing.step1_title", descKey: "landing.step1_desc" },
  { icon: HelpCircle, titleKey: "landing.step2_title", descKey: "landing.step2_desc" },
  { icon: ListChecks, titleKey: "landing.step3_title", descKey: "landing.step3_desc" },
];

const TRUST_PILLARS = [
  { icon: BookOpen, titleKey: "landing.trust1_title", descKey: "landing.trust1_desc" },
  { icon: Microscope, titleKey: "landing.trust2_title", descKey: "landing.trust2_desc" },
  { icon: ShieldCheck, titleKey: "landing.trust3_title", descKey: "landing.trust3_desc" },
];

const ALL_FEATURES = [
  {
    icon: TrendingUp,
    title: "Behavior Tracking",
    desc: "Log positive and negative behaviors daily. See patterns, streaks, and improvement over time.",
    gradient: "linear-gradient(135deg,#10B981,#06B6D4)",
    badge: "Popular",
  },
  {
    icon: Video,
    title: "Parenting Reels",
    desc: "Short, expert-curated video reels on positive parenting techniques. Watch anywhere, anytime.",
    gradient: "linear-gradient(135deg,#EC4899,#A855F7)",
    badge: null,
  },
  {
    icon: Lightbulb,
    title: "Daily Parenting Tips",
    desc: "Fresh, science-backed parenting tip delivered every day — just for you.",
    gradient: "linear-gradient(135deg,#FFD166,#F97316)",
    badge: null,
  },
  {
    icon: Baby,
    title: "Infant Sleep Tracker",
    desc: "Track feeding, sleep windows and wake cycles for babies under 12 months. Amy guides every step.",
    gradient: "linear-gradient(135deg,#60A5FA,#6366F1)",
    badge: "New",
  },
  {
    icon: GraduationCap,
    title: "Olympiad Zone",
    desc: "Skill-building puzzles and challenges aligned with school Olympiad levels for kids aged 4–14.",
    gradient: "linear-gradient(135deg,#F59E0B,#EF4444)",
    badge: null,
  },
  {
    icon: Palette,
    title: "Art & Craft Reels",
    desc: "Fun activity videos with step-by-step crafts to keep kids creative and engaged.",
    gradient: "linear-gradient(135deg,#EC4899,#F97316)",
    badge: null,
  },
  {
    icon: FileText,
    title: "Printable Worksheets",
    desc: "Download and print age-appropriate worksheets for learning, colouring, and motor skills.",
    gradient: "linear-gradient(135deg,#06B6D4,#10B981)",
    badge: null,
  },
  {
    icon: Activity,
    title: "Life Skills Zone",
    desc: "Teach your child independence — from dressing to cooking — with structured milestone tracking.",
    gradient: "linear-gradient(135deg,#A855F7,#6366F1)",
    badge: null,
  },
  {
    icon: Puzzle,
    title: "Daily Puzzles",
    desc: "Brain-boosting daily puzzles tailored to your child's age that build logic and creativity.",
    gradient: "linear-gradient(135deg,#F97316,#A855F7)",
    badge: null,
  },
  {
    icon: BookOpen,
    title: "Parenting Articles",
    desc: "Deep-dive articles written by child development experts on every stage of childhood.",
    gradient: "linear-gradient(135deg,#3B82F6,#06B6D4)",
    badge: null,
  },
  {
    icon: Users,
    title: "Babysitter Profiles",
    desc: "Create and share child care profiles with babysitters securely. Routines, allergies, and notes — all in one place.",
    gradient: "linear-gradient(135deg,#10B981,#A855F7)",
    badge: null,
  },
  {
    icon: Award,
    title: "Parent Score & Streaks",
    desc: "Gamified tracking keeps you motivated — earn points, build streaks, and celebrate wins.",
    gradient: "linear-gradient(135deg,#FFD166,#EF4444)",
    badge: null,
  },
];

const TESTIMONIALS = [
  {
    name: "Priya M.",
    location: "Mumbai, India",
    text: "Amy Coach literally changed how I parent. My son's tantrums reduced in 2 weeks — I finally have a step-by-step plan that works, not just random tips.",
    avatar: "P",
    color: "#A855F7",
  },
  {
    name: "Rahul & Kavya",
    location: "Bangalore, India",
    text: "We use the routines every morning. Our daughter wakes up excited because she knows her schedule. The behavior tracker helped us spot that she gets cranky after 9pm.",
    avatar: "R",
    color: "#06B6D4",
  },
  {
    name: "Sarah K.",
    location: "Dubai, UAE",
    text: "As a first-time mom of twins, this app is my lifesaver. The infant sleep tracker + Amy's daily tips keep me sane. Worth every second.",
    avatar: "S",
    color: "#EC4899",
  },
];

export default function LandingPage() {
  const { t } = useTranslation();
  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden text-white relative"
      style={{
        background: "linear-gradient(160deg,#0f0c29 0%,#302b63 55%,#24243e 100%)",
      }}
    >
      <style>{`
        @keyframes amyFloat {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-10px) }
        }
        @keyframes amyBounce {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-6px) }
        }
        @keyframes amyPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.6) }
          50% { box-shadow: 0 0 0 18px rgba(168,85,247,0) }
        }
        @keyframes amyFadeUp {
          from { opacity: 0; transform: translateY(24px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes amyShimmer {
          0% { background-position: 0% 50% }
          100% { background-position: 200% 50% }
        }
        @keyframes amyColorCycle {
          0%   { color: #7B3FF2 }
          25%  { color: #FF4ECD }
          50%  { color: #4FC3F7 }
          75%  { color: #FFD166 }
          100% { color: #7B3FF2 }
        }
        @keyframes amyCounterGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.3) }
          50% { box-shadow: 0 0 24px 4px rgba(168,85,247,0.2) }
        }
        @keyframes scrollX {
          0% { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
        .amy-float { animation: amyFloat 5s ease-in-out infinite }
        .amy-bounce { animation: amyBounce 2.6s ease-in-out infinite }
        .amy-pulse { animation: amyPulse 2.8s ease-out infinite }
        .amy-fade-up { animation: amyFadeUp 0.8s ease-out both }
        .amy-fade-up-1 { animation: amyFadeUp 0.8s ease-out 0.1s both }
        .amy-fade-up-2 { animation: amyFadeUp 0.8s ease-out 0.2s both }
        .amy-fade-up-3 { animation: amyFadeUp 0.8s ease-out 0.35s both }
        .amy-fade-up-4 { animation: amyFadeUp 0.8s ease-out 0.5s both }
        .amy-color-cycle {
          animation: amyColorCycle 4s ease-in-out infinite;
          will-change: color;
          text-shadow: 0 0 24px rgba(168,85,247,0.35);
        }
        .amy-gradient-text {
          background: linear-gradient(90deg,#A855F7,#6366F1,#06B6D4,#A855F7);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: amyShimmer 6s linear infinite;
        }
        .amy-glass {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .amy-glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.1);
          transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
        }
        .amy-glass-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 50px -10px rgba(168,85,247,0.4);
          border-color: rgba(168,85,247,0.4);
        }
        .amy-cta {
          background: linear-gradient(135deg,#A855F7 0%,#EC4899 100%);
          box-shadow: 0 10px 40px rgba(168,85,247,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset;
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .amy-cta:hover {
          transform: scale(1.05);
          box-shadow: 0 14px 50px rgba(236,72,153,0.6), 0 0 0 1px rgba(255,255,255,0.2) inset;
        }
        .amy-stat-card {
          animation: amyCounterGlow 3s ease-in-out infinite;
        }
        .amy-feature-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .amy-feature-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 16px 40px -8px rgba(168,85,247,0.35);
          border-color: rgba(168,85,247,0.35);
        }
        .amy-testimonial {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          transition: border-color .3s ease, box-shadow .3s ease;
        }
        .amy-testimonial:hover {
          border-color: rgba(168,85,247,0.3);
          box-shadow: 0 12px 40px -8px rgba(168,85,247,0.25);
        }
        .marquee-track {
          display: flex;
          gap: 12px;
          animation: scrollX 28s linear infinite;
          width: max-content;
        }
        .marquee-track:hover { animation-play-state: paused }
        @keyframes amyBlink {
          0%, 90%, 100% { transform: scaleY(1) }
          92% { transform: scaleY(0.16) }
          94% { transform: scaleY(0.04) }
          96% { transform: scaleY(0.22) }
        }
        @keyframes amyCapBob {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-1px) }
        }
        @keyframes amyCapShine {
          0%, 100% { opacity: 0.7 }
          50% { opacity: 1 }
        }
        .amy-eye {
          display: inline-block;
          width: 10px;
          height: 10px;
          background: #1a1a2e;
          border-radius: 50%;
          border: 2px solid white;
          animation: amyBlink 3.5s ease-in-out infinite;
          transform-origin: center;
        }
        .amy-face-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg,#6D28D9,#8B5CF6,#C084FC);
          border-radius: 50%;
          width: 26px;
          height: 26px;
          gap: 3px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(124,58,237,0.48);
          position: relative;
          animation: amyCapBob 2.6s ease-in-out infinite;
        }
        .amy-face-wrap::before {
          content: "";
          position: absolute;
          top: -5px;
          left: 2px;
          right: 2px;
          height: 8px;
          border-radius: 999px 999px 4px 4px;
          background: linear-gradient(90deg,#4C1D95,#7C3AED,#A855F7,#C084FC);
          box-shadow: 0 1px 0 rgba(255,255,255,0.4) inset;
          animation: amyCapShine 2.8s ease-in-out infinite;
        }
        .amy-face-iris {
          display: inline-block;
          width: 7px;
          height: 7px;
          background: #fff;
          border-radius: 50%;
          position: relative;
          z-index: 1;
          box-shadow: 0 0 0 1px rgba(30,20,60,0.25);
        }
      `}</style>

      {/* Glow blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle,#A855F7,transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle,#3B82F6,transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle,#EC4899,transparent 70%)" }}
        />
        <div
          className="absolute top-2/3 left-10 w-[300px] h-[300px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle,#06B6D4,transparent 70%)" }}
        />
      </div>

      {/* NAV */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img
              src={logoImg}
              alt="AmyNest AI"
              className="h-14 w-auto object-contain"
              style={{
                mixBlendMode: "screen",
                filter: "drop-shadow(0 0 14px rgba(168,85,247,0.6)) brightness(1.1)",
              }}
            />
            <div className="flex flex-col leading-tight hidden sm:flex">
              <span
                className="font-quicksand font-black text-base"
                style={{
                  background: "linear-gradient(90deg,#A855F7,#EC4899,#06B6D4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Amy Nest AI
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-white/50 font-medium">
                <span className="amy-face-wrap">
                  <span className="amy-face-iris" style={{ width: "7px", height: "7px" }} />
                  <span className="amy-face-iris" style={{ width: "7px", height: "7px" }} />
                </span>
                AI Parenting Coach
              </span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/sign-in">
            <button className="text-sm font-semibold text-white/70 hover:text-white transition-colors px-3 py-1.5">
              {t("landing.nav_sign_in")}
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="amy-cta text-sm font-bold px-5 py-2 rounded-xl text-white hidden md:flex items-center gap-1.5">
              Get Started Free <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center text-center px-5 pt-12 pb-16">
        <div className="amy-fade-up amy-glass mb-8 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white/80">
          <Sparkles className="h-3.5 w-3.5 text-purple-300" />
          {t("landing.badge")}
        </div>

        <div className="amy-fade-up-1 relative -mb-6 flex items-center justify-center">
          <div className="amy-float">
            <img
              src={heroImg}
              alt="AmyNest AI"
              className="w-96 md:w-[620px] object-contain"
              style={{
                mixBlendMode: "screen",
                filter:
                  "drop-shadow(0 0 40px rgba(168,85,247,0.55)) drop-shadow(0 0 80px rgba(99,102,241,0.35))",
              }}
            />
          </div>
        </div>

        <h1 className="amy-fade-up-2 amy-color-cycle font-quicksand font-black text-4xl md:text-6xl leading-[1.1] tracking-tight max-w-3xl mb-4">
          {t("landing.hero_headline")}
        </h1>

        <Link href="/sign-in">
          <p className="amy-fade-up-2 text-white/55 text-sm mb-5 hover:text-white/80 transition-colors cursor-pointer">
            Already a Smart Parent - Kindly sign in{" "}
            <span className="text-purple-300 font-semibold underline underline-offset-2">
              here
            </span>
          </p>
        </Link>

        <p className="amy-fade-up-3 text-white/75 text-base md:text-xl max-w-xl leading-relaxed mb-10">
          {t("landing.hero_sub")}
        </p>

        <div className="amy-fade-up-4 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/sign-up">
            <button
              className="amy-cta inline-flex items-center gap-2 text-base md:text-lg font-bold px-9 md:px-10 py-4 md:py-5 rounded-2xl text-white"
              data-testid="button-hero-cta"
            >
              {t("landing.hero_cta")}
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
          <Link href="/sign-in">
            <button className="amy-glass inline-flex items-center gap-2 text-sm font-semibold px-7 py-4 rounded-2xl text-white/80 hover:text-white hover:border-white/20 transition-all">
              <Play className="h-4 w-4 text-purple-300" />
              See How It Works
            </button>
          </Link>
        </div>

      </section>

      {/* PROBLEM HOOK */}
      <section className="relative z-10 px-5 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 amy-glass mb-4 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white/80">
              <Sparkles className="h-3 w-3 text-pink-300" />
              {t("landing.problems_eyebrow")}
            </div>
            <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-white mb-3">
              {t("landing.problems_heading")}
            </h2>
            <p className="text-white/60 text-base max-w-lg mx-auto">
              {t("landing.problems_sub")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
            {PROBLEMS.map(({ icon: Icon, labelKey, color }) => (
              <div
                key={labelKey}
                className="amy-glass-card rounded-2xl p-4 md:p-5 flex items-center gap-3"
              >
                <div
                  className="h-10 w-10 md:h-11 md:w-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${color}20`,
                    border: `1px solid ${color}40`,
                  }}
                >
                  <Icon className="h-5 w-5 md:h-5 md:w-5" style={{ color }} />
                </div>
                <span className="text-white/90 text-sm md:text-base font-semibold">{t(labelKey)}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-white/70 text-base md:text-lg italic">
            {t("landing.not_alone")}
          </p>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="relative z-10 px-5 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-white mb-3">
              {t("landing.features_heading")}
            </h2>
            <p className="text-white/60 text-base max-w-lg mx-auto">
              {t("landing.features_sub")}
            </p>
          </div>

          {/* Amy Coach hero card */}
          <div
            className="amy-glass-card rounded-3xl p-7 md:p-10 mb-5 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(168,85,247,0.18) 0%, rgba(99,102,241,0.12) 60%, rgba(255,255,255,0.04) 100%)",
              borderColor: "rgba(168,85,247,0.35)",
            }}
          >
            <div
              aria-hidden
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-40 pointer-events-none"
              style={{ background: "radial-gradient(circle,#A855F7,transparent 70%)" }}
            />
            <div className="relative">
              <div className="flex flex-col md:flex-row md:items-start gap-5 md:gap-7 mb-6">
                <div
                  className="h-14 w-14 md:h-16 md:w-16 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg,#A855F7,#6366F1)",
                    boxShadow: "0 10px 30px rgba(168,85,247,0.45)",
                  }}
                >
                  <Brain className="h-7 w-7 md:h-8 md:w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <h3 className="font-quicksand font-bold text-xl md:text-2xl text-white">
                      {t("landing.coach_title")}
                    </h3>
                    <span
                      className="text-[10px] md:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
                      style={{
                        background: "linear-gradient(135deg,#A855F7,#EC4899)",
                        boxShadow: "0 4px 14px rgba(236,72,153,0.4)",
                      }}
                    >
                      {t("landing.core_feature")}
                    </span>
                  </div>
                  <p className="text-white/75 text-sm md:text-base leading-relaxed">
                    {t("landing.coach_desc")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {COACH_HIGHLIGHT_KEYS.map((key) => (
                  <div
                    key={key}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-purple-300 shrink-0" />
                    <span className="text-white/85 text-xs md:text-sm font-medium">{t(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Secondary feature cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {SECONDARY_FEATURES.map(({ icon: Icon, titleKey, descKey, gradient }) => (
              <div
                key={titleKey}
                className="amy-glass-card rounded-3xl p-5 md:p-7 flex flex-col gap-3 md:gap-4"
              >
                <div
                  className="h-11 w-11 md:h-12 md:w-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: gradient,
                    boxShadow: "0 8px 24px rgba(168,85,247,0.25)",
                  }}
                >
                  <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-quicksand font-bold text-base md:text-lg text-white mb-1.5 md:mb-2">
                    {t(titleKey)}
                  </h3>
                  <p className="text-white/65 text-xs md:text-sm leading-relaxed">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Mid CTA */}
          <div className="text-center mt-12">
            <p className="text-white/80 text-base md:text-lg mb-5 font-medium">
              {t("landing.mid_cta")}
            </p>
            <Link href="/sign-up">
              <button
                className="amy-cta inline-flex items-center gap-2 text-sm md:text-base font-bold px-7 md:px-8 py-3.5 md:py-4 rounded-2xl text-white"
                data-testid="button-features-cta"
              >
                {t("landing.mid_cta_btn")}
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ALL FEATURES MEGA GRID */}
      <section className="relative z-10 px-5 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 amy-glass mb-4 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white/80">
              <Sparkles className="h-3 w-3 text-cyan-300" />
              Everything in One App
            </div>
            <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-white mb-3">
              12+ Tools for the Modern Parent
            </h2>
            <p className="text-white/60 text-base max-w-xl mx-auto">
              From newborns to teens — AmyNest covers every milestone, challenge, and daily moment.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {ALL_FEATURES.map(({ icon: Icon, title, desc, gradient, badge }) => (
              <div
                key={title}
                className="amy-feature-card rounded-2xl p-5 md:p-6 flex flex-col gap-3 relative overflow-hidden"
              >
                {badge && (
                  <span
                    className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                    style={{
                      background: badge === "New"
                        ? "linear-gradient(135deg,#06B6D4,#3B82F6)"
                        : "linear-gradient(135deg,#F97316,#EF4444)",
                    }}
                  >
                    {badge}
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: gradient,
                      boxShadow: "0 6px 18px rgba(168,85,247,0.25)",
                    }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-quicksand font-bold text-base text-white mb-1">{title}</h3>
                    <p className="text-white/60 text-xs md:text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA after mega grid */}
          <div className="text-center mt-12">
            <Link href="/sign-up">
              <button className="amy-cta inline-flex items-center gap-2 text-base font-bold px-8 py-4 rounded-2xl text-white">
                Unlock All Features Free
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <p className="mt-3 text-xs text-white/40">Free plan included · Upgrade anytime</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 px-5 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 amy-glass mb-4 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white/80">
              <Zap className="h-3 w-3 text-yellow-300" />
              {t("landing.how_eyebrow")}
            </div>
            <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-white mb-3">
              {t("landing.how_heading")}
            </h2>
            <p className="text-white/60 text-base max-w-lg mx-auto">
              {t("landing.how_sub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {STEPS.map(({ icon: Icon, titleKey, descKey }, idx) => (
              <div
                key={titleKey}
                className="amy-glass-card rounded-3xl p-6 md:p-7 relative"
              >
                <div
                  className="absolute -top-3 -left-3 h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm font-quicksand"
                  style={{
                    background: "linear-gradient(135deg,#A855F7,#EC4899)",
                    boxShadow: "0 6px 18px rgba(236,72,153,0.45)",
                  }}
                >
                  {idx + 1}
                </div>
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "linear-gradient(135deg,#A855F7,#6366F1)",
                    boxShadow: "0 8px 24px rgba(168,85,247,0.3)",
                  }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-quicksand font-bold text-lg md:text-xl text-white mb-2">
                  {t(titleKey)}
                </h3>
                <p className="text-white/65 text-sm leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="relative z-10 px-5 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 amy-glass mb-4 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full text-white/80">
              <Heart className="h-3 w-3 text-pink-300" />
              Parent Stories
            </div>
            <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-white mb-3">
              Real Parents, Real Results
            </h2>
            <p className="text-white/60 text-base max-w-lg mx-auto">
              Thousands of families use AmyNest every day to raise happier, calmer, more confident kids.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, location, text, avatar, color }) => (
              <div key={name} className="amy-testimonial rounded-3xl p-6 flex flex-col gap-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed flex-1">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{
                      background: `linear-gradient(135deg,${color},${color}99)`,
                      boxShadow: `0 4px 14px ${color}40`,
                    }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{name}</p>
                    <p className="text-white/50 text-xs">{location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / SCIENCE */}
      <section className="relative z-10 px-5 pb-20">
        <div className="max-w-5xl mx-auto">
          <div
            className="amy-glass rounded-3xl p-7 md:p-12 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(168,85,247,0.10) 100%)",
              borderColor: "rgba(168,85,247,0.25)",
            }}
          >
            <div
              aria-hidden
              className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle,#6366F1,transparent 70%)" }}
            />

            <div className="relative text-center mb-9">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
                style={{
                  background: "linear-gradient(135deg,#6366F1,#A855F7)",
                  boxShadow: "0 10px 30px rgba(99,102,241,0.45)",
                }}
              >
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <h2 className="font-quicksand font-bold text-2xl md:text-4xl text-white leading-tight mb-3">
                {t("landing.trust_heading")}
              </h2>
              <p className="text-white/65 text-base max-w-xl mx-auto leading-relaxed">
                {t("landing.trust_sub")}
              </p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {TRUST_PILLARS.map(({ icon: Icon, titleKey, descKey }) => (
                <div
                  key={titleKey}
                  className="rounded-2xl p-5 md:p-6"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: "rgba(168,85,247,0.20)",
                      border: "1px solid rgba(168,85,247,0.35)",
                    }}
                  >
                    <Icon className="h-5 w-5 text-purple-300" />
                  </div>
                  <h3 className="font-quicksand font-bold text-base md:text-lg text-white mb-1.5">
                    {t(titleKey)}
                  </h3>
                  <p className="text-white/65 text-xs md:text-sm leading-relaxed">{t(descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 px-5 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="amy-glass rounded-3xl p-10 md:p-14 relative overflow-hidden"
            style={{ borderColor: "rgba(168,85,247,0.3)" }}
          >
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center,rgba(168,85,247,0.12) 0%,transparent 70%)",
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-6"
                style={{
                  background: "linear-gradient(135deg,#A855F7,#EC4899)",
                  boxShadow: "0 12px 40px rgba(236,72,153,0.4)",
                }}
              >
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-white leading-tight mb-4">
                {t("landing.final_cta_heading")}
              </h2>
              <p className="text-white/70 text-base md:text-lg mb-3 leading-relaxed">
                {t("landing.final_cta_sub")}
              </p>
              <p className="text-white/50 text-sm mb-8">
                Join <span className="text-purple-300 font-semibold">50,000+ parents</span> already parenting smarter with AmyNest AI.
              </p>
              <Link href="/sign-up">
                <button
                  className="amy-cta inline-flex items-center gap-2 text-base md:text-lg font-bold px-10 md:px-12 py-4 md:py-5 rounded-2xl text-white"
                  data-testid="button-final-cta"
                >
                  {t("landing.final_cta_btn")}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <p className="mt-4 text-xs text-white/40">✨ Free to start — Join the smart parenting revolution.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 px-5 py-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <img
                src={logoImg}
                alt="AmyNest AI"
                className="h-12 w-auto object-contain"
                style={{
                  mixBlendMode: "screen",
                  filter: "drop-shadow(0 0 12px rgba(168,85,247,0.55)) brightness(1.1)",
                }}
              />
              <div className="flex flex-col leading-tight">
                <span
                  className="font-quicksand font-black text-sm"
                  style={{
                    background: "linear-gradient(90deg,#A855F7,#EC4899,#06B6D4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Amy Nest AI
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/45 font-medium">
                  <span className="amy-face-wrap" style={{ width: "20px", height: "20px" }}>
                    <span className="amy-face-iris" style={{ width: "6px", height: "6px" }} />
                    <span className="amy-face-iris" style={{ width: "6px", height: "6px" }} />
                  </span>
                  Where Smart Parenting Begins
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/40">
            <Link href="/sign-up"><span className="hover:text-white/70 transition-colors cursor-pointer">Sign Up</span></Link>
            <Link href="/sign-in"><span className="hover:text-white/70 transition-colors cursor-pointer">Sign In</span></Link>
          </div>
          <p className="text-xs text-white/30">© 2026 AmyNest AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
