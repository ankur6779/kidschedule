import { Link } from "wouter";
import { Calendar, Activity, Users, ArrowRight, Sparkles, Bot, ImagePlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import logoImg from "@assets/AmyNest_logo_with_nurturing_design_1775845143817.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-background/95 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <BrandLogo size="sm" showTagline={false} />
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="ghost" data-testid="link-sign-in">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button data-testid="link-sign-up">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 flex-1">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src={logoImg}
            alt="AmyNest"
            className="h-28 w-28 rounded-full object-cover shadow-xl ring-4 ring-white"
            style={{ filter: "drop-shadow(0 8px 24px rgba(59,130,246,0.2))" }}
          />
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: "linear-gradient(135deg, #EEF2FF, #F0FDF4)", color: "#6366F1", border: "1px solid #C7D2FE" }}>
              <Sparkles className="h-3 w-3" />
              Amy AI-Powered Parenting
            </span>
          </div>
        </div>
        <h1 className="font-quicksand text-4xl md:text-6xl font-bold text-foreground max-w-3xl leading-tight mb-4">
          Where Smart Parenting Begins
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          Generate personalized daily schedules in seconds. Track behavior, build healthy habits, and stay organized as a family.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 text-base px-8" data-testid="button-get-started">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="text-base px-8" data-testid="button-sign-in-hero">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 bg-card border-t">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Existing features */}
            <div className="flex flex-col gap-3 p-5 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-quicksand text-lg font-bold">Amy AI Routine Generator</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Enter your child's age, school times, and goals — and get a full structured daily schedule instantly.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-5 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="font-quicksand text-lg font-bold">Behavior Tracker</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Log positive, neutral, and challenging moments with a tap. See trends and celebrate wins.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-5 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-secondary-foreground">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-quicksand text-lg font-bold">Multiple Children</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Manage routines and behavior for each child individually, all in one place.
              </p>
            </div>

            {/* New AI-powered features */}
            <div className="flex flex-col gap-3 p-5 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 hover:shadow-md transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)", color: "#fff" }}>
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-quicksand text-lg font-bold">Amy AI Parenting Assistant</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)", color: "#fff" }}>
                  NEW
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ask anything about your child — from behavior and habits to study and health — and get smart, practical advice instantly.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-5 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50/60 to-orange-50/40 hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, #F59E0B, #EC4899)", color: "#fff" }}>
                <ImagePlay className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-quicksand text-lg font-bold">Amy AI Cartoon Routine</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "linear-gradient(135deg, #F59E0B, #EC4899)", color: "#fff" }}>
                  NEW
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                See your child in their daily routine with Amy AI-generated cartoon images — making habits fun and easy to follow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <BrandLogo size="sm" showTagline={false} />
          <span className="text-muted-foreground">— Where Smart Parenting Begins</span>
        </div>
      </footer>
    </div>
  );
}
