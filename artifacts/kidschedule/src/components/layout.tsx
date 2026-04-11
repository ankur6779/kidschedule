import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Users, Calendar, Star, Menu, LogOut, UserCircle, Baby, Bot, TrendingUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useClerk, useUser } from "@clerk/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Dashboard",     icon: Home },
  { href: "/children",      label: "Children",      icon: Users },
  { href: "/routines",      label: "Routines",      icon: Calendar },
  { href: "/parenting-hub", label: "Parenting Hub", icon: BookOpen },
  { href: "/progress",      label: "Progress",      icon: TrendingUp },
  { href: "/behavior",      label: "Behavior",      icon: Star },
  { href: "/assistant",     label: "AI Assistant",  icon: Bot },
  { href: "/babysitters",   label: "Babysitters",   icon: Baby },
  { href: "/parent-profile",label: "My Profile",    icon: UserCircle },
];

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard",     label: "Dashboard", icon: Home },
  { href: "/routines",      label: "Routines",  icon: Calendar },
  { href: "/parenting-hub", label: "Hub",        icon: BookOpen },
  { href: "/assistant",     label: "Assistant", icon: Bot },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const initials = user
    ? (user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? user.emailAddresses?.[0]?.emailAddress?.[0] ?? "U")
    : "U";

  const handleSignOut = () => {
    setIsSidebarOpen(false);
    signOut({ redirectUrl: "/" });
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:hidden shadow-sm">
        <BrandLogo size="sm" showTagline={false} />
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
            <div className="flex items-center gap-3 mt-4 mb-6 pb-4 border-b">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : user?.emailAddresses?.[0]?.emailAddress}
                </span>
                <span className="text-xs text-muted-foreground truncate">{user?.emailAddresses?.[0]?.emailAddress}</span>
              </div>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    location === item.href || location.startsWith(item.href)
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 mt-4 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 flex-col border-r bg-card md:flex">
          <div className="flex h-20 items-center border-b px-5 shadow-sm">
            <BrandLogo size="md" showTagline={true} />
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                  location === item.href || location.startsWith(item.href)
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
          {/* Desktop user / sign-out */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "My Account"}
                </span>
                <span className="text-xs text-muted-foreground truncate">{user?.emailAddresses?.[0]?.emailAddress}</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              data-testid="button-sign-out"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-5xl p-4 md:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 z-40 flex h-16 w-full items-center justify-around border-t bg-background/80 backdrop-blur-md md:hidden pb-safe">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-1 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
