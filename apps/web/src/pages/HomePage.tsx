import { moodFor, trainedGains, type RoastLevel, type State } from "@iron-coach/core";
import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactElement } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AvatarSlot } from "../components/AvatarSlot";
import { CoachBubble } from "../components/CoachBubble";
import { ConnectionError } from "../components/ConnectionError";
import { GainBurst } from "../components/GainBurst";
import { MuscleBars } from "../components/MuscleBars";
import { useGameState, type CheckinCelebration, type GameState } from "../gameState";

// The screen is at its reddest and darkest from this many skip days, when the coach goes nuclear.
const WORST_SKIP_DAYS = 5;

const SAVAGE_SHAKE = { size: 6, seconds: 0.5 };
const NUCLEAR_SHAKE = { size: 14, seconds: 0.9 };
const SHAKES: Partial<Record<RoastLevel, { size: number; seconds: number }>> = {
  savage: SAVAGE_SHAKE,
  nuclear: NUCLEAR_SHAKE,
};

function Stat({ label, value, icon }: {
  readonly label: string;
  readonly value: number;
  readonly icon?: ReactElement;
}): ReactElement {
  return (
    <div className="bg-plate p-4">
      <p className="flex items-center gap-2 font-display text-6xl leading-none font-black tabular-nums">
        {icon}
        {value}
      </p>
      <p className="font-semibold">{label}</p>
    </div>
  );
}

function Flame(): ReactElement {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-12 fill-hazard">
      <path d="M12 2c1 4-4 6-4 11a4 4 0 0 0 1 3c-2-1-3-3-3-5-2 2-3 4-3 6a9 9 0 0 0 18 0c0-6-5-9-9-15Z" />
    </svg>
  );
}

function CheckInButton({ state }: { readonly state: State }): ReactElement {
  const shared = "block p-5 text-center font-display text-6xl font-black uppercase sm:text-8xl";

  if (state.checkedInToday) {
    return <p className={`${shared} bg-plate text-chalk`}>Done today</p>;
  }
  return (
    <Link to="/checkin" className={`${shared} bg-iron-red text-mat transition-colors hover:bg-hazard`}>
      Check in
    </Link>
  );
}

function Home({ state, roast }: GameState): ReactElement {
  const [screen, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const [celebration] = useState(
    () => (location.state as { readonly celebration?: CheckinCelebration } | null)?.celebration,
  );

  // Cleared straight away, so a page reload doesn't celebrate the same check-in again.
  useEffect(() => {
    if (celebration) void navigate(".", { replace: true, state: null });
  }, [celebration, navigate]);

  // Started by hand because App's AnimatePresence blocks a motion element's first animation on page load.
  useEffect(() => {
    const shake = SHAKES[state.roastLevel];
    if (!shake || reduceMotion) return;
    const { size, seconds } = shake;
    const running = animate(screen.current, { x: [0, -size, size, -size, size, 0] }, { duration: seconds });
    return () => running.stop();
  }, [state.roastLevel, reduceMotion, animate, screen]);

  return (
    // Clipped, so the shake never adds a sideways scrollbar.
    <main className="relative min-h-dvh overflow-x-clip">
      <div
        aria-hidden="true"
        style={{ opacity: Math.min(state.skipDays / WORST_SKIP_DAYS, 1) }}
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_25%,#ff2d2d80,#000000e6)] transition-opacity duration-700"
      />

      <div
        ref={screen}
        className="relative mx-auto flex min-h-dvh max-w-6xl flex-col gap-5 p-4 sm:p-6"
      >
        <header className="flex items-center justify-between gap-4">
          <p className="font-display text-3xl font-black uppercase">Iron Coach</p>
          <nav aria-label="Main" className="flex items-center gap-5 font-semibold">
            <Link to="/history" className="py-2.5 underline-offset-4 hover:underline">
              History
            </Link>
            <Link to="/settings" className="py-2.5 underline-offset-4 hover:underline">
              Settings
            </Link>
          </nav>
        </header>

        <CoachBubble key={roast} line={roast} />

        <div className="grid flex-1 gap-5 lg:grid-cols-[14rem_1fr_18rem]">
          <section aria-label="Your stats" className="flex flex-col gap-3">
            <h1 className="-rotate-2 self-start bg-hazard px-3 py-1 font-display text-4xl font-black text-mat uppercase">
              {state.title}
            </h1>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              <Stat label="Day streak" value={state.streak} icon={<Flame />} />
              <Stat label="Skip days" value={state.skipDays} />
            </div>
          </section>

          <div className="flex">
            <AvatarSlot mood={moodFor(state)} />
          </div>

          <section aria-label="Muscles">
            <MuscleBars muscles={state.muscles} startFrom={celebration?.before} />
          </section>
        </div>

        <CheckInButton state={state} />
      </div>

      {celebration && (
        <GainBurst gains={trainedGains(celebration.before, state.muscles, celebration.trained)} />
      )}
    </main>
  );
}

export function HomePage(): ReactElement | null {
  const { data, isError, refetch } = useGameState();

  if (!data) return isError ? <ConnectionError onRetry={() => void refetch()} /> : null;
  return <Home {...data} />;
}
