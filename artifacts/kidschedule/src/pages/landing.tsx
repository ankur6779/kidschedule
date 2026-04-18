import { Link } from "wouter";
import { ArrowRight, Sparkles, Brain, Calendar, LayoutGrid, MessageCircle } from "lucide-react";
import logoImg from "@assets/ChatGPT_Image_Apr_18,_2026,_08_23_40_PM_1776526432358.png";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Coach",
    desc: "Deep, personalized step-by-step parenting plans rooted in child psychology — built just for your child.",
    gradient: "linear-gradient(135deg,#A855F7,#6366F1)",
  },
  {
    icon: Calendar,
    title: "Smart Routines",
    desc: "Structured daily routines that help your child build strong, lasting habits effortlessly.",
    gradient: "linear-gradient(135deg,#06B6D4,#3B82F6)",
  },
  {
    icon: LayoutGrid,
    title: "Parent Hub",
    desc: "Activities, insights, and curated parenting guidance — everything you need in one place.",
    gradient: "linear-gradient(135deg,#EC4899,#F97316)",
  },
];

export default function LandingPage() {
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
        @keyframes amyChatPulse {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(168,85,247,0.55),
              0 12px 36px rgba(168,85,247,0.45);
          }
          50% {
            box-shadow:
              0 0 0 16px rgba(168,85,247,0),
              0 16px 44px rgba(236,72,153,0.55);
          }
        }
        @keyframes amyChatFloat {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-6px) }
        }
        @keyframes amyTipBounce {
          0%, 100% { transform: translateY(0) }
          50% { transform: translateY(-3px) }
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
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="AmyNest AI" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-quicksand font-bold text-base text-white tracking-tight">
            AmyNest <span className="amy-gradient-text">AI</span>
          </span>
        </div>
        <Link href="/sign-in">
          <button className="text-sm font-semibold text-white/70 hover:text-white transition-colors px-3 py-1.5">
            Sign in
          </button>
        </Link>
      </header>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center text-center px-5 pt-12 pb-24">
        {/* Badge */}
        <div className="amy-fade-up amy-glass mb-8 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white/80">
          <Sparkles className="h-3.5 w-3.5 text-purple-300" />
          AI-Powered Parenting Coach
        </div>

        {/* Big floating logo */}
        <div className="amy-fade-up-1 relative mb-8 flex items-center justify-center">
          <div className="amy-float">
            <img
              src={logoImg}
              alt="AmyNest AI"
              className="h-36 w-36 md:h-44 md:w-44 rounded-3xl object-contain"
              style={{ filter: "drop-shadow(0 12px 50px rgba(168,85,247,0.6))" }}
            />
          </div>
        </div>

        {/* Headline — animated color cycle */}
        <h1 className="amy-fade-up-2 amy-color-cycle font-quicksand font-black text-4xl md:text-6xl leading-[1.1] tracking-tight max-w-3xl mb-5">
          Where Smart Parenting Begins
        </h1>

        {/* Subtext */}
        <p className="amy-fade-up-3 text-white/75 text-base md:text-xl max-w-xl leading-relaxed mb-10">
          Get step-by-step, science-backed parenting plans personalized for your child — by your AI Parenting Coach.
        </p>

        {/* Single Primary CTA */}
        <div className="amy-fade-up-4">
          <Link href="/sign-up">
            <button
              className="amy-cta inline-flex items-center gap-2 text-base md:text-lg font-bold px-9 md:px-10 py-4 md:py-5 rounded-2xl text-white"
              data-testid="button-hero-cta"
            >
              Start Parenting Smarter
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>

        <p className="amy-fade-up-4 mt-6 text-xs text-white/50">
          ✨ Free to start · No credit card required
        </p>
      </section>

      {/* VALUE / FEATURES */}
      <section className="relative z-10 px-5 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-quicksand font-bold text-3xl md:text-4xl text-white mb-3">
              Everything you need to parent smarter
            </h2>
            <p className="text-white/60 text-base max-w-lg mx-auto">
              Three powerful tools, one beautifully simple app — built around your family.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, gradient }) => (
              <div
                key={title}
                className="amy-glass-card rounded-3xl p-7 flex flex-col gap-4"
              >
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: gradient,
                    boxShadow: "0 8px 24px rgba(168,85,247,0.3)",
                  }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-quicksand font-bold text-lg text-white mb-2">{title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
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
              Ready to start your parenting journey?
            </h2>
            <p className="text-white/70 text-base md:text-lg mb-8 leading-relaxed">
              Join AmyNest AI and get a personalized parenting plan in minutes — completely free.
            </p>
            <Link href="/sign-up">
              <button
                className="amy-cta inline-flex items-center gap-2 text-base md:text-lg font-bold px-10 md:px-12 py-4 md:py-5 rounded-2xl text-white"
                data-testid="button-final-cta"
              >
                Start Parenting Smarter
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FLOATING AMY AI CHAT BUTTON — bottom-right */}
      <Link
        href="/sign-up"
        className="amy-chat-fab fixed z-50 group"
        style={{ bottom: 24, right: 20 }}
        data-testid="link-amy-chat-fab"
        aria-label="Talk to Amy AI"
      >
          {/* Tooltip */}
          <div
            className="amy-chat-tooltip absolute right-0 whitespace-nowrap text-xs font-bold px-3.5 py-2 rounded-full"
            style={{
              bottom: "calc(100% + 14px)",
              background: "rgba(255,255,255,0.96)",
              color: "#0f0c29",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.4) inset",
              animation: "amyTipBounce 2.6s ease-in-out infinite",
            }}
          >
            💬 Talk to Amy AI
            {/* arrow */}
            <span
              className="absolute"
              style={{
                right: 22,
                bottom: -5,
                width: 10,
                height: 10,
                background: "rgba(255,255,255,0.96)",
                transform: "rotate(45deg)",
                boxShadow: "2px 2px 4px rgba(0,0,0,0.08)",
              }}
            />
          </div>

          {/* Soft outer glow */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full -z-10"
            style={{
              background: "radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%)",
              filter: "blur(18px)",
              transform: "scale(1.4)",
            }}
          />

          {/* Avatar */}
          <div
            className="amy-chat-avatar relative h-16 w-16 md:h-[68px] md:w-[68px] rounded-full flex items-center justify-center text-3xl md:text-[32px] select-none overflow-hidden"
            style={{
              background:
                "conic-gradient(from 200deg, #7B3FF2, #FF4ECD, #4FC3F7, #7B3FF2)",
              padding: 3,
              animation:
                "amyChatFloat 3.4s ease-in-out infinite, amyChatPulse 2.8s ease-out infinite",
            }}
          >
            <div
              className="h-full w-full rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #FFFFFF 0%, #F3E8FF 55%, #E9D5FF 100%)",
              }}
            >
              <span style={{ filter: "drop-shadow(0 2px 4px rgba(124,58,237,0.25))" }}>
                😊
              </span>
            </div>
          </div>
      </Link>

      <style>{`
        .amy-chat-fab .amy-chat-tooltip {
          opacity: 0;
          transform: translateY(4px);
          transition: opacity .25s ease, transform .25s ease;
          pointer-events: none;
        }
        .amy-chat-fab:hover .amy-chat-tooltip,
        .amy-chat-fab:focus .amy-chat-tooltip {
          opacity: 1;
          transform: translateY(0);
        }
        .amy-chat-fab .amy-chat-avatar {
          transition: transform .3s ease, filter .3s ease;
        }
        .amy-chat-fab:hover .amy-chat-avatar {
          transform: scale(1.08);
          filter: drop-shadow(0 0 24px rgba(236,72,153,0.7));
        }
      `}</style>

      {/* FOOTER */}
      <footer className="relative z-10 px-5 py-8 border-t border-white/10 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="AmyNest AI" className="h-6 w-6 rounded-md object-contain" />
            <span className="font-quicksand font-bold text-sm text-white/80">
              AmyNest <span className="amy-gradient-text">AI</span>
            </span>
          </div>
          <p className="text-xs text-white/40">Where Smart Parenting Begins</p>
        </div>
      </footer>
    </div>
  );
}
