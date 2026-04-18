import { Link, useLocation } from "wouter";
import { AmyIcon } from "@/components/amy-icon";

export function AmyFab() {
  const [location] = useLocation();
  if (location.startsWith("/assistant") || location.startsWith("/sign-in") || location.startsWith("/sign-up")) {
    return null;
  }
  return (
    <div className="fixed right-4 z-50 bottom-20 md:bottom-6 amy-fade-in">
      <Link
        href="/assistant"
        aria-label="Ask Amy AI"
        className="group relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-amber-200 dark:from-amber-500/25 via-rose-200 to-violet-300 shadow-lg ring-4 ring-white/70 hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-400"
      >
        <span className="absolute inset-0 rounded-full amy-pulse pointer-events-none" />
        <AmyIcon size={42} bounce />
        <span className="absolute -top-2 -right-1 bg-white text-[9px] font-black text-violet-700 dark:text-violet-200 px-1.5 py-0.5 rounded-full shadow border border-violet-200 dark:border-violet-400/30 pointer-events-none">
          Amy AI
        </span>
      </Link>
    </div>
  );
}
