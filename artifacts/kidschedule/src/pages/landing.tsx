import { Link } from "wouter";
import {
  ArrowRight, Sparkles, Brain, CheckCircle2, Target,
  TrendingUp, MessageSquareHeart, Zap, Moon, Utensils,
  Tv2, Frown, Ear, Lightbulb, FlaskConical, BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import logoImg from "@assets/AmyNest_logo_with_nurturing_design_1775845143817.png";

/* ─── data ───────────────────────────────────────────────────────── */
const STRUGGLES = [
  { icon: Frown,           label: "Tantrums & Anger",  color: "#EF4444", bg: "#FEF2F2" },
  { icon: Tv2,             label: "Screen Addiction",   color: "#F59E0B", bg: "#FFFBEB" },
  { icon: Moon,            label: "Sleep Problems",     color: "#6366F1", bg: "#EEF2FF" },
  { icon: Ear,             label: "Not Listening",      color: "#8B5CF6", bg: "#F5F3FF" },
  { icon: Utensils,        label: "Fussy Eating",       color: "#10B981", bg: "#ECFDF5" },
  { icon: Lightbulb,       label: "Low Focus",          color: "#EC4899", bg: "#FDF2F8" },
];

const STEPS = [
  {
    n: "01",
    title: "Choose your goal",
    desc: "Pick from 29 real parenting challenges — behavior, sleep, eating, screen time, and more.",
    color: "#6366F1",
  },
  {
    n: "02",
    title: "Answer a few questions",
    desc: "Tell Amy about your child's age, situation, and what you've already tried.",
    color: "#A855F7",
  },
  {
    n: "03",
    title: "Get a personalized plan",
    desc: "Receive a 10–12 step deep coaching plan built on real child psychology — just for your family.",
    color: "#EC4899",
  },
];

const SCIENCE_PILLARS = [
  {
    icon: Brain,
    title: "Habit Formation Principles",
    desc: "Plans rooted in how children actually build lasting habits through repetition, reward, and environment design.",
    color: "#6366F1",
  },
  {
    icon: FlaskConical,
    title: "Emotional Development Research",
    desc: "Evidence-based strategies drawn from developmental psychology and child behaviour studies.",
    color: "#A855F7",
  },
  {
    icon: BookOpen,
    title: "Real-World Parenting Frameworks",
    desc: "Techniques validated by experts like Dr. Harvey Karp, Dr. Becky Kennedy, and decades of peer-reviewed research.",
    color: "#EC4899",
  },
];

/* ─── component ─────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">

      {/* ── NAV ── */}
      <header
        className="flex items-center justify-between px-5 py-3 sticky top-0 z-50 border-b border-white/60"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)" }}
      >
        <BrandLogo size="sm" showTagline={false} />
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-slate-600 hidden sm:inline-flex" data-testid="link-sign-in">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button
              size="sm"
              className="font-semibold text-sm px-4"
              style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)", color: "#fff", border: "none" }}
              data-testid="link-sign-up"
            >
              Get started free
            </Button>
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className="relative flex flex-col items-center text-center px-5 pt-16 pb-20 overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#EEF2FF 0%,#F5F3FF 40%,#FDF2F8 70%,#EFF6FF 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div aria-hidden className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle,#A855F7,transparent 70%)" }} />
        <div aria-hidden className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle,#6366F1,transparent 70%)" }} />

        {/* Badge */}
        <div className="landing-fade-up mb-6 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full border"
          style={{ background: "rgba(99,102,241,0.08)", color: "#6366F1", borderColor: "#C7D2FE" }}>
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Parenting Coach
        </div>

        {/* Logo */}
        <div className="landing-fade-up-1 landing-float mb-6">
          <img
            src={logoImg}
            alt="AmyNest AI"
            className="h-24 w-24 rounded-full object-cover shadow-2xl ring-4 ring-white"
            style={{ filter: "drop-shadow(0 8px 32px rgba(99,102,241,0.35))" }}
          />
        </div>

        {/* Headline */}
        <h1 className="landing-fade-up-2 font-quicksand font-bold text-4xl md:text-6xl leading-[1.1] text-slate-900 max-w-2xl mb-4">
          Your Personal{" "}
          <span className="landing-shimmer-text">AI Parenting Coach</span>
        </h1>

        {/* Sub-headline */}
        <p className="landing-fade-up-3 text-slate-500 text-lg md:text-xl max-w-xl leading-relaxed mb-10">
          Get step-by-step, science-backed solutions for your child's behavior, habits, and growth —
          personalized for your family.
        </p>

        {/* CTAs */}
        <div className="landing-fade-up-4 flex flex-col sm:flex-row items-center gap-3">
          <Link href="/sign-up">
            <Button
              size="lg"
              className="gap-2 text-base font-semibold px-8 shadow-xl shadow-indigo-200/60"
              style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)", color: "#fff", border: "none" }}
              data-testid="button-get-started"
            >
              Start Parenting Smarter
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button
              size="lg"
              variant="outline"
              className="text-base font-semibold px-8 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              data-testid="button-sign-in-hero"
            >
              Try Amy Coach
            </Button>
          </Link>
        </div>

        {/* Social proof micro-line */}
        <p className="landing-fade-in mt-8 text-xs text-slate-400 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Free to start · No credit card required · 29 parenting goals covered
        </p>
      </section>

      {/* ── AMY COACH FEATURE ── */}
      <section className="px-5 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-3xl p-8 md:p-12 border"
            style={{
              background: "linear-gradient(135deg,#EEF2FF 0%,#F5F3FF 50%,#FDF2F8 100%)",
              borderColor: "#E0E7FF",
            }}
          >
            {/* Tag */}
            <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)", color: "#fff" }}>
              <Zap className="h-3 w-3" />
              MAIN FEATURE
            </div>

            <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-slate-900 leading-tight mb-4">
              Amy Coach — Solve Real Parenting Challenges
            </h2>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-2xl mb-10">
              From tantrums to screen time, sleep to focus — Amy Coach gives you deep, personalized
              step-by-step plans that actually work. No generic advice, only science-backed solutions
              tailored to your child.
            </p>

            {/* Highlights grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                { icon: Target,              text: "Personalized plans for your child",          color: "#6366F1" },
                { icon: CheckCircle2,        text: "10–12 deep, actionable steps",               color: "#A855F7" },
                { icon: TrendingUp,          text: "Progress tracking built-in",                 color: "#EC4899" },
                { icon: MessageSquareHeart,  text: "Continuous guidance until resolved",         color: "#10B981" },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-white">
                  <span className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-xl"
                    style={{ background: `${color}18`, color }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{text}</span>
                </div>
              ))}
            </div>

            <Link href="/sign-up">
              <Button
                size="lg"
                className="gap-2 text-base font-semibold px-8"
                style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)", color: "#fff", border: "none" }}
              >
                Start with Amy Coach
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROBLEM HOOK ── */}
      <section className="px-5 py-16 md:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-slate-900 mb-3">
            Struggling with these?
          </h2>
          <p className="text-slate-400 text-base mb-10">Every parent does. You're in the right place.</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
            {STRUGGLES.map(({ icon: Icon, label, color, bg }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2.5 rounded-2xl p-5 md:p-6 border border-transparent transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: bg }}
              >
                <span className="flex items-center justify-center h-11 w-11 rounded-2xl"
                  style={{ background: `${color}20`, color }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-slate-700 text-center">{label}</span>
              </div>
            ))}
          </div>

          <p className="text-slate-500 text-base font-medium">
            You're not alone — and you don't have to figure it out yourself.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-5 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-slate-900 mb-3">
              How it works
            </h2>
            <p className="text-slate-400 text-base">Three simple steps to better parenting</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ n, title, desc, color }) => (
              <div
                key={n}
                className="relative flex flex-col gap-4 rounded-3xl p-7 border bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <span
                  className="text-4xl font-black leading-none"
                  style={{ color: `${color}30` }}
                >
                  {n}
                </span>
                <div className="flex-1">
                  <h3 className="font-quicksand font-bold text-lg text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
                <div className="h-1 rounded-full w-10" style={{ background: color }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCIENCE / TRUST ── */}
      <section
        className="px-5 py-16 md:py-20"
        style={{ background: "linear-gradient(160deg,#EEF2FF,#F5F3FF 60%,#FDF2F8)" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}>
              <Brain className="h-3 w-3" />
              Built on science
            </div>
            <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-slate-900 mb-3">
              Child psychology &amp; behavioural science
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              Amy Coach doesn't give generic tips. Every plan is grounded in decades of research
              and expert frameworks — so it actually works.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SCIENCE_PILLARS.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="flex flex-col gap-4 rounded-2xl p-6 bg-white border shadow-sm"
              >
                <span className="flex items-center justify-center h-11 w-11 rounded-2xl"
                  style={{ background: `${color}15`, color }}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-quicksand font-bold text-base text-slate-900 mb-1.5">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ── */}
      <section className="px-5 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-slate-900 leading-tight mb-4">
            Ready to become a more confident parent?
          </h2>
          <p className="text-slate-400 text-base mb-8">
            Join AmyNest AI and get a personalized parenting plan in minutes — completely free.
          </p>
          <Link href="/sign-up">
            <Button
              size="lg"
              className="gap-2 text-base font-semibold px-10 shadow-xl shadow-indigo-200/60"
              style={{ background: "linear-gradient(135deg,#6366F1,#A855F7)", color: "#fff", border: "none" }}
            >
              Start Parenting Smarter
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-5 py-6 border-t text-center">
        <div className="flex flex-col items-center gap-1">
          <BrandLogo size="sm" showTagline={false} />
          <p className="text-xs text-slate-400 mt-1">Where Smart Parenting Begins</p>
        </div>
      </footer>

    </div>
  );
}
