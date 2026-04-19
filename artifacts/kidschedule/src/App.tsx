import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import LandingPage from "@/pages/landing";

import Dashboard from "@/pages/dashboard";
import ChildrenList from "@/pages/children/index";
import ChildForm from "@/pages/children/form";
import RoutinesList from "@/pages/routines/index";
import RoutineGenerate from "@/pages/routines/generate";
import RoutineDetail from "@/pages/routines/detail";
import BehaviorTracker from "@/pages/behavior/index";
import ParentProfile from "@/pages/parent-profile";
import BabysittersPage from "@/pages/babysitters/index";
import AssistantPage from "@/pages/assistant";
import ProgressPage from "@/pages/progress";
import ParentingHub from "@/pages/parenting-hub";
import AmyCoachPage from "@/pages/ai-coach";
import AmyCoachProgressPage from "@/pages/ai-coach-progress";
import OnboardingPage from "@/pages/onboarding";
import PricingPage from "@/pages/pricing";
import { PaywallProvider } from "@/contexts/paywall-context";
import { PaywallModal } from "@/components/paywall-modal";
import { SubscriptionEventBridge } from "@/components/subscription-event-bridge";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/amynest-logo.png`,
  },
  variables: {
    colorPrimary: "#6366F1",
    colorBackground: "#FAFAFA",
    colorInputBackground: "#FFFFFF",
    colorText: "#0F172A",
    colorTextSecondary: "#64748B",
    colorInputText: "#0F172A",
    colorNeutral: "#94A3B8",
    borderRadius: "12px",
    fontFamily: "'Quicksand', 'Inter', sans-serif",
    fontFamilyButtons: "'Quicksand', 'Inter', sans-serif",
    fontSize: "15px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "shadow-2xl shadow-indigo-100/60 rounded-2xl w-full overflow-hidden border border-indigo-100",
    card: "!shadow-none !border-0 !bg-white !rounded-none",
    footer: "!shadow-none !border-0 !bg-slate-50 !rounded-none border-t border-slate-100",
    headerTitle: { color: "#0F172A", fontWeight: "700", fontSize: "22px" },
    headerSubtitle: { color: "#64748B", fontSize: "14px" },
    socialButtonsBlockButtonText: { color: "#0F172A", fontWeight: "600" },
    socialButtonsBlockButton: "border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors",
    formFieldLabel: { color: "#374151", fontWeight: "600", fontSize: "13px" },
    formFieldInput: "border-slate-200 focus:border-indigo-400 focus:ring-indigo-200 rounded-xl",
    formButtonPrimary: "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 !shadow-lg !shadow-indigo-200/50 rounded-xl font-semibold",
    footerActionLink: { color: "#6366F1", fontWeight: "600" },
    footerActionText: { color: "#64748B" },
    footerAction: "py-3",
    dividerText: { color: "#94A3B8", fontSize: "12px" },
    dividerLine: "bg-slate-200",
    logoBox: "flex justify-center mb-1",
    logoImage: "h-14 w-14 object-contain",
    identityPreviewEditButton: { color: "#6366F1" },
    formFieldSuccessText: { color: "#10B981" },
    alertText: { color: "#EF4444" },
    alert: "rounded-xl",
    otpCodeFieldInput: "border-slate-200 focus:border-indigo-400 rounded-xl",
    formFieldRow: "mb-1",
    main: "px-1",
  },
};

const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back to AmyNest AI",
      subtitle: "Sign in to your personal parenting coach",
    },
  },
  signUp: {
    start: {
      title: "Join AmyNest AI",
      subtitle: "Your AI-powered parenting coach, personalized for your family",
    },
  },
};

function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(160deg,#EEF2FF 0%,#F5F3FF 50%,#FDF2F8 100%)" }}
    >
      <div className="w-full max-w-md">
        {children}
      </div>
      <p className="mt-6 text-xs text-slate-400">Where Smart Parenting Begins</p>
    </div>
  );
}

function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <AuthPageWrapper>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </AuthPageWrapper>
  );
}

function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <AuthPageWrapper>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </AuthPageWrapper>
  );
}

function useOnboardingStatus() {
  const { isSignedIn } = useAuth();
  const authFetch = useAuthFetch();
  const localDone = localStorage.getItem("onboardingComplete") === "true";
  return useQuery({
    queryKey: ["onboarding-status"],
    queryFn: async () => {
      const res = await authFetch("/api/onboarding");
      if (!res.ok) {
        localStorage.removeItem("onboardingComplete");
        return { onboardingComplete: false, profileComplete: false };
      }
      const data = await res.json() as { onboardingComplete: boolean; profileComplete: boolean };
      if (data.onboardingComplete) {
        localStorage.setItem("onboardingComplete", "true");
      } else {
        localStorage.removeItem("onboardingComplete");
      }
      return data;
    },
    enabled: !!isSignedIn,
    staleTime: 30_000,
    initialData: localDone ? { onboardingComplete: true, profileComplete: false } : undefined,
    initialDataUpdatedAt: 0,
  });
}

function ProfileLockScreen() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-4xl shadow-md">🔒</div>
      <div>
        <h2 className="text-xl font-bold text-indigo-700 mb-2">Complete your profile first</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Add your child and parent details to unlock all sections.
          Amy Coach is always available to guide you!
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setLocation("/children/new")}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow"
        >
          👶 Add Child Profile
        </button>
        <button
          onClick={() => setLocation("/parent-profile")}
          className="px-5 py-2.5 rounded-2xl bg-white border border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 active:scale-95 transition-all shadow"
        >
          👤 Add Parent Profile
        </button>
      </div>
      <button
        onClick={() => setLocation("/amy-coach")}
        className="text-xs text-indigo-400 hover:text-indigo-600 underline underline-offset-2 transition-colors"
      >
        Go to Amy Coach →
      </button>
    </div>
  );
}

function HomeRedirect() {
  const { data, isLoading } = useOnboardingStatus();
  return (
    <>
      <Show when="signed-in">
        {isLoading
          ? null
          : data?.onboardingComplete
            ? <Redirect to={data.profileComplete ? "/dashboard" : "/amy-coach"} />
            : <Redirect to="/onboarding" />
        }
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component, requiresProfile = true }: { component: React.ComponentType; requiresProfile?: boolean }) {
  const { data, isLoading } = useOnboardingStatus();
  return (
    <>
      <Show when="signed-in">
        {isLoading
          ? null
          : !data?.onboardingComplete
            ? <Redirect to="/onboarding" />
            : (requiresProfile && !data.profileComplete)
              ? <Layout><ProfileLockScreen /></Layout>
              : <Layout><Component /></Layout>
        }
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkAuthSetup() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(() => getToken());
    } else {
      setAuthTokenGetter(null);
    }
  }, [isSignedIn, getToken]);

  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

const queryClient = new QueryClient();

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      localization={clerkLocalization}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
        <TooltipProvider>
        <PaywallProvider>
          <ClerkAuthSetup />
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/onboarding">
              {() => (
                <>
                  <Show when="signed-in"><OnboardingPage /></Show>
                  <Show when="signed-out"><Redirect to="/sign-in" /></Show>
                </>
              )}
            </Route>
            <Route path="/dashboard">
              {() => <ProtectedRoute component={Dashboard} />}
            </Route>
            <Route path="/children">
              {() => <ProtectedRoute component={ChildrenList} requiresProfile={false} />}
            </Route>
            <Route path="/children/new">
              {() => <ProtectedRoute component={ChildForm} requiresProfile={false} />}
            </Route>
            <Route path="/children/:id">
              {() => <ProtectedRoute component={ChildForm} requiresProfile={false} />}
            </Route>
            <Route path="/routines">
              {() => <ProtectedRoute component={RoutinesList} />}
            </Route>
            <Route path="/routines/generate">
              {() => <ProtectedRoute component={RoutineGenerate} />}
            </Route>
            <Route path="/routines/:id">
              {() => <ProtectedRoute component={RoutineDetail} />}
            </Route>
            <Route path="/behavior">
              {() => <ProtectedRoute component={BehaviorTracker} />}
            </Route>
            <Route path="/parent-profile">
              {() => <ProtectedRoute component={ParentProfile} requiresProfile={false} />}
            </Route>
            <Route path="/babysitters">
              {() => <ProtectedRoute component={BabysittersPage} />}
            </Route>
            <Route path="/assistant">
              {() => <ProtectedRoute component={AssistantPage} />}
            </Route>
            <Route path="/progress">
              {() => <ProtectedRoute component={ProgressPage} />}
            </Route>
            <Route path="/parenting-hub">
              {() => <ProtectedRoute component={ParentingHub} />}
            </Route>
            <Route path="/amy-coach">
              {() => <ProtectedRoute component={AmyCoachPage} requiresProfile={false} />}
            </Route>
            <Route path="/amy-coach/progress">
              {() => <ProtectedRoute component={AmyCoachProgressPage} requiresProfile={false} />}
            </Route>
            <Route path="/pricing">
              {() => <ProtectedRoute component={PricingPage} requiresProfile={false} />}
            </Route>
            <Route component={NotFound} />
          </Switch>
          <PaywallModal />
          <SubscriptionEventBridge />
          <Toaster />
        </PaywallProvider>
        </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
