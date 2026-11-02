import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactElement } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { useMe } from "./auth";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

const WIPE_SECONDS = 0.22;
// eslint-disable-next-line ts-patterns/no-magic-numbers -- the four points of a cubic-bezier curve
const WIPE_EASE = [0.76, 0, 0.24, 1] as const;
const WIPE_TRANSITION = { duration: WIPE_SECONDS, ease: WIPE_EASE };

const ONBOARDING_STEP = 8;
const CHECKIN_STEP = 9;
const LATER_STEP = 10;

const WIPE_VARIANTS = {
  covered: { scaleY: 1, originY: 0 },
  open: { scaleY: 0, originY: 0, transition: WIPE_TRANSITION },
  covering: { scaleY: [0, 1], originY: 1, transition: WIPE_TRANSITION },
};

function ConnectionError({ onRetry }: { readonly onRetry: () => void }): ReactElement {
  return (
    <main className="grid min-h-dvh place-content-center gap-5 p-6 text-center">
      <p role="alert" className="text-lg">
        Can't reach Iron Coach. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mx-auto cursor-pointer bg-iron-red px-5 py-3 font-display text-2xl font-black text-mat uppercase"
      >
        Try again
      </button>
    </main>
  );
}

function ProtectedRoute(): ReactElement | null {
  const { pathname } = useLocation();
  const { data: user, isPending, isError, refetch } = useMe();

  if (isPending) return null;
  if (isError) return <ConnectionError onRetry={() => void refetch()} />;
  if (!user) return <Navigate to="/login" replace state={{ from: pathname }} />;
  return <Outlet />;
}

/** Login and register. Keeps the page on screen while a logged-in user is sent onward. */
function GuestRoute(): ReactElement | null {
  const { state } = useLocation();
  const { data: user, isPending, isError, refetch } = useMe();
  const from = (state as { readonly from?: string } | null)?.from ?? "/";

  if (isPending) return null;
  if (isError) return <ConnectionError onRetry={() => void refetch()} />;
  return (
    <>
      {user && <Navigate to={from} replace />}
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
            <Route path="/" element={<ComingSoonPage title="Home" step={ONBOARDING_STEP} />} />
            <Route
              path="/onboarding"
              element={<ComingSoonPage title="Onboarding" step={ONBOARDING_STEP} />}
            />
            <Route path="/checkin" element={<ComingSoonPage title="Check in" step={CHECKIN_STEP} />} />
            <Route path="/history" element={<ComingSoonPage title="History" step={LATER_STEP} />} />
            <Route path="/settings" element={<ComingSoonPage title="Settings" step={LATER_STEP} />} />
          </Route>
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
