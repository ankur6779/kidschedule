import { Link } from "wouter";
import { Calendar, Activity, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@assets/AmyNest_logo_with_nurturing_design_1775845143817.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <img src={logoImg} alt="AmyNest" className="h-12 w-auto" />
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
        <img src={logoImg} alt="AmyNest" className="h-28 w-auto mb-8" />
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
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-quicksand text-lg font-bold">AI Routine Generator</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enter your child's age, school times, and goals — and get a full structured daily schedule instantly.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-quicksand text-lg font-bold">Behavior Tracker</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Log positive, neutral, and challenging moments with a tap. See trends and celebrate wins.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-secondary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-quicksand text-lg font-bold">Multiple Children</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Manage routines and behavior for each child individually, all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t text-center text-sm text-muted-foreground">
        AmyNest — Where Smart Parenting Begins
      </footer>
    </div>
  );
}
