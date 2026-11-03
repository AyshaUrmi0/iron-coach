import { MUSCLE_GROUPS, type MuscleGroup, type Muscles } from "@iron-coach/core";
import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactElement } from "react";

const MAX_SCORE = 100;
const GROW_SECONDS = 0.8;
const GROW_EASE = "easeOut";

function MuscleBar({ group, score }: { readonly group: MuscleGroup; readonly score: number }): ReactElement {
  const [bar, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const shown = useRef(0);

  // Started by hand because App's AnimatePresence blocks a motion element's first animation on page load.
  useEffect(() => {
    const size = score / MAX_SCORE;
    const running = animate(
      bar.current,
      { scaleX: [shown.current, size] },
      { duration: reduceMotion ? 0 : GROW_SECONDS, ease: GROW_EASE },
    );
    // Only once finished: StrictMode runs this twice on load, and the second run must still grow from 0.
    void running.then(() => (shown.current = size));
    return () => running.stop();
  }, [score, reduceMotion, animate, bar]);

  return (
    <li>
      <div className="flex justify-between font-display text-xl font-black uppercase">
        <span>{group}</span>
        <span className="tabular-nums">{score}</span>
      </div>
      <div
        role="meter"
        aria-label={group}
        aria-valuemin={0}
        aria-valuemax={MAX_SCORE}
        aria-valuenow={score}
        className="h-4 bg-plate"
      >
        <div ref={bar} style={{ transform: "scaleX(0)" }} className="h-full origin-left bg-iron-red" />
      </div>
    </li>
  );
}

export function MuscleBars({ muscles }: { readonly muscles: Muscles }): ReactElement {
  return (
    <ul className="flex flex-col gap-3">
      {MUSCLE_GROUPS.map((group) => (
        <MuscleBar key={group} group={group} score={muscles[group]} />
      ))}
    </ul>
  );
}
