import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, type ReactElement } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { useMe } from "./auth";
import { ConnectionError } from "./components/ConnectionError";
import { DemoBanner } from "./components/DemoBanner";
import { AvatarLabPage } from "./pages/AvatarLabPage";
import { CheckinPage } from "./pages/CheckinPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MachineLabPage } from "./pages/MachineLabPage";
import { MealsPage } from "./pages/MealsPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { RegisterPage } from "./pages/RegisterPage";
import { SettingsPage } from "./pages/SettingsPage";

const WIPE_SECONDS = 0.22;
// eslint-disable-next-line ts-patterns/no-magic-numbers -- the four points of a cubic-bezier curve
const WIPE_EASE = [0.76, 0, 0.24, 1] as const;
const WIPE_TRANSITION = { duration: WIPE_SECONDS, ease: WIPE_EASE };

const WIPE_VARIANTS = {
  covered: { scaleY: 1, originY: 0 },
  open: { scaleY: 0, originY: 0, transition: WIPE_TRANSITION },
  covering: { scaleY: [0, 1], originY: 1, transition: WIPE_TRANSITION },
};

function ProtectedRoute(): ReactElement | null {
  const { pathname } = useLocation();
  const { data: user, isPending, isError, refetch } = useMe();
  // Kept stable: Navigate redirects again whenever this object is new, and the wipe keeps it on screen for a moment.
  const redirectState = useMemo(() => ({ from: pathname }), [pathname]);

  if (isPending) return null;
  if (isError) return <ConnectionError onRetry={() => void refetch()} />;
  if (!user) return <Navigate to="/login" replace state={redirectState} />;
  return (
    <>
      {user.isDemo && <DemoBanner />}
      <Outlet />
    </>
  );
}

/**
 * Login and register. Keeps the page on screen while a logged-in user is sent onward.
 * Demo users may stay, because signing up or logging in is how they keep their data.
 */
function GuestRoute(): ReactElement | null {
  const { state } = useLocation();
  const { data: user, isPending, isError, refetch } = useMe();
  const from = (state as { readonly from?: string } | null)?.from ?? "/";

  if (isPending) return null;
  if (isError) return <ConnectionError onRetry={() => void refetch()} />;
  return (
    <>
      {user && !user.isDemo && <Navigate to={from} replace />}
      <Outlet />
    </>
  );
}

export default function App(): ReactElement {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={location.pathname} initial="covered" animate="open" exit="covering">
        {/* The location prop keeps the outgoing page on its own route while it wipes away. */}
        <Routes location={location}>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/checkin" element={<CheckinPage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/machine-lab" element={<MachineLabPage />} />
          </Route>
          {import.meta.env.DEV && <Route path="/avatar-lab" element={<AvatarLabPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!reduceMotion && (
          <motion.div
            aria-hidden="true"
            variants={WIPE_VARIANTS}
            className="pointer-events-none fixed inset-0 z-50 bg-iron-red"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
