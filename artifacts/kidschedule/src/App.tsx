import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
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

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
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
        <TooltipProvider>
          <ClerkAuthSetup />
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard">
              {() => <ProtectedRoute component={Dashboard} />}
            </Route>
            <Route path="/children">
              {() => <ProtectedRoute component={ChildrenList} />}
            </Route>
            <Route path="/children/new">
              {() => <ProtectedRoute component={ChildForm} />}
            </Route>
            <Route path="/children/:id">
              {() => <ProtectedRoute component={ChildForm} />}
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
              {() => <ProtectedRoute component={ParentProfile} />}
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
              {() => <ProtectedRoute component={AmyCoachPage} />}
            </Route>
            <Route path="/amy-coach/progress">
              {() => <ProtectedRoute component={AmyCoachProgressPage} />}
            </Route>
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
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
