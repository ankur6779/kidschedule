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
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import logoImg from "@assets/ChatGPT_Image_Apr_19,_2026,_01_56_21_PM_1776587201948.png";
import heroImg from "@assets/ChatGPT_Image_Apr_19,_2026,_02_02_56_PM_1776587585367.png";
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
        .amy-tooltip {
          opacity: 0;
          transform: translateY(4px);
          transition: opacity .25s ease, transform .25s ease;
          pointer-events: none;
        }
        .amy-mascot:hover .amy-tooltip {
          opacity: 1;
          transform: translateY(0);
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
      </div>

      {/* NAV — minimal */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/sign-in">
            <button className="text-sm font-semibold text-white/70 hover:text-white transition-colors px-3 py-1.5">
              {t("landing.nav_sign_in")}
            </button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center text-center px-5 pt-12 pb-24">
        {/* Badge */}
        <div className="amy-fade-up amy-glass mb-8 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white/80">
          <Sparkles className="h-3.5 w-3.5 text-purple-300" />
          {t("landing.badge")}
        </div>

        {/* Big floating logo */}
        <div className="amy-fade-up-1 relative mb-8 flex items-center justify-center">
          <div
            className="amy-float relative w-80 h-64 md:w-[480px] md:h-80 overflow-hidden"
            style={{ borderRadius: "50% / 40%" }}
          >
            <img
              src={heroImg}
              alt="AmyNest AI"
              className="block w-full h-full object-cover"
            />
            {/* Inner glow / edge fade */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                boxShadow: "inset 0 0 80px 40px #0f0c29",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Headline — animated color cycle */}
        <h1 className="amy-fade-up-2 amy-color-cycle font-quicksand font-black text-4xl md:text-6xl leading-[1.1] tracking-tight max-w-3xl mb-5">
          {t("landing.hero_headline")}
        </h1>

        {/* Subtext */}
        <p className="amy-fade-up-3 text-white/75 text-base md:text-xl max-w-xl leading-relaxed mb-10">
          {t("landing.hero_sub")}
        </p>

        {/* Single Primary CTA */}
        <div className="amy-fade-up-4">
          <Link href="/sign-up">
            <button
              className="amy-cta inline-flex items-center gap-2 text-base md:text-lg font-bold px-9 md:px-10 py-4 md:py-5 rounded-2xl text-white"
              data-testid="button-hero-cta"
            >
              {t("landing.hero_cta")}
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>

        <p className="amy-fade-up-4 mt-6 text-xs text-white/50">
          {t("landing.hero_free")}
        </p>
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

      {/* VALUE / FEATURES */}
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

          {/* Amy Coach — highlighted hero card with bullets */}
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
          <div className="amy-glass rounded-3xl p-10 md:p-14">
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
            <p className="text-white/70 text-base md:text-lg mb-8 leading-relaxed">
              {t("landing.final_cta_sub")}
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
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 px-5 py-8 border-t border-white/10 text-center">
        <div className="flex flex-col items-center gap-2">
          <BrandLogo size="sm" />
          <p className="text-xs text-white/40">{t("landing.footer_tagline")}</p>
        </div>
      </footer>
    </div>
  );
}
